from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .config import config
from .database import init_db
from .api.routes import auth, connectors, brain, metrics

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title=config.PROJECT_NAME, version=config.VERSION)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# Include Routes
app.include_router(auth.router, prefix=f"{config.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(connectors.router, prefix=f"{config.API_V1_STR}/vault", tags=["Secure Vault"])
app.include_router(brain.router, prefix=f"{config.API_V1_STR}/brain", tags=["Brain Fusion"])
app.include_router(metrics.router, prefix=f"{config.API_V1_STR}/metrics", tags=["System Metrics"])

@app.get("/")
async def root():
    return {"message": "NEURO-OS API is Live", "version": config.VERSION}
