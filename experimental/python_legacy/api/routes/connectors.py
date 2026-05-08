from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ...database import get_session
from ...models import Connector, User
from ...auth import get_current_user

router = APIRouter()

@router.get("/list", response_model=List[dict])
async def list_connectors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """List all connectors for the current user (summary only, no keys)."""
    connectors = db.exec(select(Connector).where(Connector.user_id == current_user.id)).all()
    return [
        {"id": c.id, "name": c.name, "type": c.type, "is_active": c.is_active}
        for c in connectors
    ]

@router.post("/add")
async def add_connector(
    name: str,
    type: str,
    config_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """Add a new encrypted connector to the Vault with basic validation."""
    # Basic Validation
    if type in ['openai', 'gemini', 'anthropic'] and 'api_key' not in config_data:
        raise HTTPException(status_code=400, detail=f"API Key is required for {type} connectors")
    
    if type == 'ollama' and 'base_url' not in config_data:
        config_data['base_url'] = "http://localhost:11434" # Default

    encrypted = Connector.encrypt_config(config_data)
    new_connector = Connector(
        user_id=current_user.id,
        name=name,
        type=type,
        encrypted_config=encrypted
    )
    db.add(new_connector)
    db.commit()
    return {"message": "Connector added to Secure Vault"}

@router.delete("/{connector_id}")
async def delete_connector(
    connector_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    connector = db.exec(select(Connector).where(
        Connector.id == connector_id, 
        Connector.user_id == current_user.id
    )).first()
    
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    db.delete(connector)
    db.commit()
    return {"message": "Connector deleted"}
