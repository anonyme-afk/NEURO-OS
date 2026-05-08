import { BaseConnector } from './base';
import { GeminiConnector } from './gemini';
import { OllamaConnector } from './ollama';

class ConnectorRegistry {
  private connectors: BaseConnector[] = [];

  constructor() {
    this.connectors.push(new GeminiConnector());
    this.connectors.push(new OllamaConnector());
  }

  getActiveConnectors(): BaseConnector[] {
    const isAirGapped = process.env.AIR_GAPPED_MODE === 'true';
    return this.connectors.filter(c => {
      if (!c.is_active) return false;
      if (isAirGapped && c.type !== 'local') return false;
      return true;
    });
  }

  listConnectors() {
    const isAirGapped = process.env.AIR_GAPPED_MODE === 'true';
    return this.connectors.map(c => ({
      id: c.id,
      name: c.name,
      model_name: c.model_name,
      is_active: c.is_active,
      type: c.type,
      air_gapped_blocked: isAirGapped && c.type !== 'local'
    }));
  }

  async testConnection(providerId: string, url: string, model: string): Promise<boolean | [boolean, number]> {
    const start = Date.now();
    const connector = this.connectors.find(c => c.id === providerId);
    if (!connector) throw new Error(`Provider ${providerId} not found`);
    const isOk = await connector.ping();
    return isOk ? [true, Date.now() - start] : false;
  }
  
  // This performs a mass ping to dynamically update active status
  async healthCheck() {
    await Promise.allSettled(this.connectors.map(async (c) => {
      if (c.circuit_breaker_open_until > Date.now()) {
        c.is_active = false;
        return;
      }
      const isAlive = await c.ping();
      c.is_active = isAlive;
      if (isAlive) {
        c.consecutive_failures = 0;
      }
    }));
  }
}

export const connectorRegistry = new ConnectorRegistry();
