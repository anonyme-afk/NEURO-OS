import httpx
from .base import BaseConnector

class CustomNodeConnector(BaseConnector):
    """
    Connects to a custom IA node (e.g., Flask/FastAPI app).
    Expects a POST /generate endpoint with JSON: {"prompt": "..."}
    Returns JSON: {"response": "..."}
    """
    @property
    def model_name(self) -> str:
        return f"custom/{self.config.get('ip')}:{self.config.get('port')}"

    async def generate(self, prompt: str) -> str:
        ip = self.config.get('ip')
        port = self.config.get('port')
        endpoint = self.config.get('endpoint', '/generate').lstrip('/')
        url = f"http://{ip}:{port}/{endpoint}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, json={"prompt": prompt})
            r.raise_for_status()
            data = r.json()
            return data.get("response", data.get("text", "Error: No response field found"))

    async def ping(self) -> bool:
        try:
            ip = self.config.get('ip')
            port = self.config.get('port')
            url = f"http://{ip}:{port}/health" # Standard health check
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(url)
                return r.status_code == 200
        except:
            return False
