from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
import json
from .config import config

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    
    connectors: List["Connector"] = Relationship(back_populates="user")

class Connector(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    type: str  # 'openai', 'gemini', 'anthropic', 'ollama', 'custom'
    is_active: bool = Field(default=True)
    
    # Encrypted JSON configuration (API keys, URLs, etc.)
    encrypted_config: str 
    
    user: User = Relationship(back_populates="connectors")

    def get_config(self) -> dict:
        """Decrypt and return the configuration dictionary."""
        decrypted = config.cipher_suite.decrypt(self.encrypted_config.encode()).decode()
        return json.loads(decrypted)

    @staticmethod
    def encrypt_config(config_dict: dict) -> str:
        """Encrypt a configuration dictionary."""
        json_str = json.dumps(config_dict)
        return config.cipher_suite.encrypt(json_str.encode()).decode()
