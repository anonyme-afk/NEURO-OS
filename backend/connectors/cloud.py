import openai
import anthropic
import httpx
from .base import BaseConnector

class OpenAIConnector(BaseConnector):
    @property
    def model_name(self) -> str:
        return f"openai/{self.config.get('model', 'gpt-4o-mini')}"

    async def generate(self, prompt: str) -> str:
        client = openai.AsyncOpenAI(api_key=self.config['api_key'])
        response = await client.chat.completions.create(
            model=self.config.get('model', 'gpt-4o-mini'),
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    async def ping(self) -> bool:
        try:
            client = openai.AsyncOpenAI(api_key=self.config['api_key'])
            await client.models.list()
            return True
        except:
            return False

class GeminiConnector(BaseConnector):
    """
    Direct HTTPS implementation for Gemini to support multi-user isolation
    without relying on the global genai.configure() state.
    """
    @property
    def model_name(self) -> str:
        return f"google/{self.config.get('model', 'gemini-1.5-flash')}"

    async def generate(self, prompt: str) -> str:
        model = self.config.get('model', 'gemini-1.5-flash')
        api_key = self.config['api_key']
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            # Extract text from the nested response structure
            try:
                return data['candidates'][0]['content']['parts'][0]['text']
            except (KeyError, IndexError):
                return f"Error: Unexpected Gemini response format: {data}"

    async def ping(self) -> bool:
        try:
            model = self.config.get('model', 'gemini-1.5-flash')
            api_key = self.config['api_key']
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}?key={api_key}"
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(url)
                return r.status_code == 200
        except:
            return False

class AnthropicConnector(BaseConnector):
    @property
    def model_name(self) -> str:
        return f"anthropic/{self.config.get('model', 'claude-3-5-sonnet-20240620')}"

    async def generate(self, prompt: str) -> str:
        client = anthropic.AsyncAnthropic(api_key=self.config['api_key'])
        message = await client.messages.create(
            model=self.config.get('model', 'claude-3-5-sonnet-20240620'),
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    async def ping(self) -> bool:
        try:
            client = anthropic.AsyncAnthropic(api_key=self.config['api_key'])
            return True
        except:
            return False
