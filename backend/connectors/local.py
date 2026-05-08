import httpx
from .base import BaseConnector

class OllamaConnector(BaseConnector):
    @property
    def model_name(self) -> str:
        return f"ollama/{self.config.get('model', 'llama3')}"

    async def generate(self, prompt: str) -> str:
        url = self.config.get('url', 'http://localhost:11434').rstrip('/')
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{url}/api/generate",
                json={
                    "model": self.config.get('model', 'llama3'),
                    "prompt": prompt,
                    "stream": False
                }
            )
            r.raise_for_status()
            return r.json()["response"]

    async def ping(self) -> bool:
        try:
            url = self.config.get('url', 'http://localhost:11434').rstrip('/')
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{url}/api/tags")
                return r.status_code == 200
        except:
            return False
