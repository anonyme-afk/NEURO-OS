from abc import ABC, abstractmethod

class BaseConnector(ABC):
    def __init__(self, name: str, config: dict):
        self.name = name
        self.config = config

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        """Generate response from the AI source."""
        pass

    @abstractmethod
    async def ping(self) -> bool:
        """Health check for the connector."""
        pass
