# backend/app/routers/providers.py
from fastapi import APIRouter, Depends, HTTPException

from app.config.providers import PROVIDERS
from app.deps import get_user
from app.services import providers
from app.services.errors import LLMError

router = APIRouter()


@router.get("/providers")
def list_providers(user: str = Depends(get_user)):
    return providers.list_providers()


@router.get("/providers/{pid}/models")
async def list_models(pid: str, refresh: bool = False, user: str = Depends(get_user)):
    if pid not in PROVIDERS:
        raise HTTPException(404, "Unknown provider")
    if not providers.is_configured(pid):
        raise HTTPException(400, f"{PROVIDERS[pid]['label']} API key is not set in backend/.env.")
    try:
        return await providers.fetch_models(pid, refresh)
    except LLMError as e:
        raise HTTPException(502, str(e))
