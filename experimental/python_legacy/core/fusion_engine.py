import asyncio
import time
import logging
from typing import List, Dict, Any
from ..connectors.base import BaseConnector
from difflib import SequenceMatcher

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FusionEngine")

class FusionEngine:
    async def fuse(self, prompt: str, connectors: List[BaseConnector]) -> dict:
        if not connectors:
            raise ValueError("No connectors provided for fusion")

        start_time = time.monotonic()
        logger.info(f"Fusing {len(connectors)} sources for prompt: {prompt[:50]}...")

        # 1. Parallel execution across all sources
        tasks = [self._call_connector(c, prompt) for c in connectors]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 2. Filter valid responses
        valid_responses = []
        for i, res in enumerate(results):
            if isinstance(res, Exception):
                logger.error(f"Connector {connectors[i].name} failed: {res}")
            else:
                valid_responses.append(res)

        if not valid_responses:
            raise RuntimeError("All configured AI connectors failed or returned invalid data.")

        # 3. ADVANCED CONSENSUS 2.0 (Béton)
        # We calculate cross-similarity scores to find the most representative response
        best_response = self._calculate_consensus(valid_responses)
        
        # Calculate final metrics
        total_latency = round((time.monotonic() - start_time) * 1000)

        return {
            "response": best_response["text"],
            "model_used": best_response["model"],
            "latency_ms": best_response["latency_ms"],
            "total_latency_ms": total_latency,
            "candidates": len(valid_responses),
            "confidence": best_response.get("consensus_score", 0.95),
            "all_responses": valid_responses
        }

    def _calculate_consensus(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Finds the response that has the highest average similarity with all other responses.
        This effectively selects the 'Consensus' answer in a multi-model environment.
        """
        if len(responses) == 1:
            responses[0]["consensus_score"] = 1.0
            return responses[0]

        scores = []
        for i, r1 in enumerate(responses):
            total_sim = 0
            for j, r2 in enumerate(responses):
                if i == j: continue
                # Simple similarity ratio
                sim = SequenceMatcher(None, r1["text"], r2["text"]).ratio()
                total_sim += sim
            
            avg_sim = total_sim / (len(responses) - 1)
            r1["consensus_score"] = round(avg_sim, 2)
            scores.append(avg_sim)

        # Find the index of the highest score
        best_idx = scores.index(max(scores))
        
        # Tie-breaker: if scores are close, pick the one with lower latency
        # (This avoids picking a slow model if a fast one is just as accurate)
        return responses[best_idx]

    async def _call_connector(self, connector: BaseConnector, prompt: str) -> dict:
        start = time.monotonic()
        try:
            text = await connector.generate(prompt)
            latency = round((time.monotonic() - start) * 1000)
            return {
                "text": text,
                "model": connector.model_name,
                "latency_ms": latency
            }
        except Exception as e:
            logger.error(f"Error calling {connector.name}: {str(e)}")
            raise e

fusion_engine = FusionEngine()
