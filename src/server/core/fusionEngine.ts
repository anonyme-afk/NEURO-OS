import stringSimilarity from 'string-similarity';
import Piscina from 'piscina';
import { connectorRegistry } from '../connectors/registry';
import { eventBus } from './eventBus';
import { BaseConnector } from '../connectors/base';
import { fileURLToPath } from 'url';

// Thread pool to prevent blocking the main JS event loop on O(n^2) model combinations
const workerPath = new URL('./similarityWorker.ts', import.meta.url);
const piscina = new Piscina({
  filename: fileURLToPath(workerPath)
});

class FusionEngine {
  
  async fuse(prompt: string) {
    const startTotal = Date.now();
    await connectorRegistry.healthCheck(); // Ensure we only query alive models
    const activeConnectors = connectorRegistry.getActiveConnectors();
    
    if (activeConnectors.length === 0) {
      throw new Error("No active AI connectors available. Ensure Ollama is running or GEMINI_API_KEY is set.");
    }

    eventBus.publish('ROUTER_DECISION', {
      connectors: activeConnectors.map(c => c.model_name),
      count: activeConnectors.length
    });

    // 1. Parallel REAL execution
    const tasks = activeConnectors.map(c => this.callWithTiming(c, prompt));
    const results = await Promise.allSettled(tasks);

    // Filter successful real responses
    const valid = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    if (valid.length === 0) {
      throw new Error("All connectors failed to generate a response.");
    }

    // 2. Fusion algorithm details
    // If only 1 responded, just return it.
    if (valid.length === 1) {
      return {
        response: valid[0].text,
        model_used: valid[0].model,
        latency_ms: valid[0].latency_ms,
        total_latency_ms: Date.now() - startTotal,
        candidates: 1,
        confidence: 0.99, // Highly confident because it's the only one
        all_responses: valid
      };
    }

    // Otherwise, we compute pairwise similarity to find the "Centroid" 
    // We select the response that is most structurally similar to the others (The Consensus)
    let bestIdx = 0;
    let highestScore = -1;

    for (let i = 0; i < valid.length; i++) {
      let simScorePromises: Promise<number>[] = [];
      for (let j = 0; j < valid.length; j++) {
        if (i !== j) {
          // Offload to worker threads to avoid O(n^2) event loop blocking
          simScorePromises.push(piscina.run({ text1: valid[i].text, text2: valid[j].text }));
        }
      }
      
      const scores = await Promise.all(simScorePromises);
      const simScoreTotal = scores.reduce((a, b) => a + b, 0);
      
      // Penalize for high latency
      // A faster response gets a slight bump
      const weightedScore = simScoreTotal * (1.0 / (valid[i].latency_ms + 100)); // +100 to prevent division by zero spikes

      if (weightedScore > highestScore) {
        highestScore = weightedScore;
        bestIdx = i;
      }
    }

    const best = valid[bestIdx];

    return {
      response: best.text,
      model_used: best.model,
      latency_ms: best.latency_ms,
      total_latency_ms: Date.now() - startTotal,
      candidates: valid.length,
      confidence: Math.min(0.99, Math.round((highestScore * 1000) * 100) / 100), // Adjusted arbitrary confidence scale for demo purposes
      all_responses: valid
    };
  }

  private async callWithTiming(connector: BaseConnector, prompt: string) {
    const start = Date.now();
    try {
      const text = await connector.generate(prompt);
      connector.consecutive_failures = 0; // Reset on success
      return {
        text,
        model: connector.model_name,
        latency_ms: Date.now() - start
      };
    } catch (e) {
      connector.consecutive_failures++;
      if (connector.consecutive_failures >= 3) {
        // Open circuit breaker for 30 seconds
        connector.circuit_breaker_open_until = Date.now() + 30000;
        console.warn(`[CircuitBreaker] Opened for ${connector.name} due to failures.`);
      }
      throw e;
    }
  }
}

export const fusionEngine = new FusionEngine();
