import os
from pathlib import Path
from dotenv import load_dotenv
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

load_dotenv()

class Config:
    PROJECT_NAME = "NEURO-OS"
    VERSION = "2.0.0"
    API_V1_STR = "/api/v1"
    
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-very-important-secret")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
    
    # Encryption Setup for the Vault
    # We derive a Fernet key from the SECRET_KEY to ensure consistent encryption
    _salt = b'neuro_os_salt_fixed' # In a real production, use a dynamic salt stored securely
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_salt,
        iterations=100000,
    )
    FERNET_KEY = base64.urlsafe_b64encode(kdf.derive(SECRET_KEY.encode()))
    cipher_suite = Fernet(FERNET_KEY)

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./neuro_os.db")
    
    # AI Default URLs
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

config = Config()
