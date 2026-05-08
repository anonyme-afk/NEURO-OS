from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ...database import get_session
from ...models import User, Connector
from ...auth import get_current_user
from ...core.fusion_engine import fusion_engine
from ...connectors.cloud import OpenAIConnector, GeminiConnector, AnthropicConnector
from ...connectors.local import OllamaConnector
from ...connectors.custom import CustomNodeConnector

router = APIRouter()

@router.post("/think")
async def think(
    prompt: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    # 1. Fetch active connectors for this user
    user_connectors = db.exec(select(Connector).where(
        Connector.user_id == current_user.id,
        Connector.is_active == True
    )).all()

    if not user_connectors:
        raise HTTPException(status_code=400, detail="No active connectors configured in your Vault")

    # 2. Instantiate real connector objects
    instances = []
    for c in user_connectors:
        config = c.get_config()
        if c.type == 'openai':
            instances.append(OpenAIConnector(c.name, config))
        elif c.type == 'gemini':
            instances.append(GeminiConnector(c.name, config))
        elif c.type == 'anthropic':
            instances.append(AnthropicConnector(c.name, config))
        elif c.type == 'ollama':
            instances.append(OllamaConnector(c.name, config))
        elif c.type == 'custom':
            instances.append(CustomNodeConnector(c.name, config))

    # 3. Parallel Fusion
    try:
        result = await fusion_engine.fuse(prompt, instances)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
