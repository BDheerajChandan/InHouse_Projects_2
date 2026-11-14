# backend/app/routers/bots.py
from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_user
from app.schemas import BotIn
from app.services import bots, persona, providers

router = APIRouter()


def _clean(body: BotIn) -> dict:
    try:
        cfg = persona.validate(body.model_dump())
    except ValueError as e:
        raise HTTPException(422, str(e))
    if not providers.is_configured(cfg["provider"]):
        raise HTTPException(422, "The selected provider has no API key in backend/.env")
    return cfg


@router.get("/options")
def options():
    return persona.OPTIONS


@router.get("/bots")
def list_bots(user: str = Depends(get_user)):
    return bots.list_bots(user)


@router.post("/bots")
def create_bot(body: BotIn, user: str = Depends(get_user)):
    cfg = _clean(body)
    if bots.count_bots(user) >= bots.MAX_BOTS:
        raise HTTPException(400, f"Bot limit reached ({bots.MAX_BOTS}). Delete a bot first.")
    return bots.get_bot(user, bots.create_bot(user, cfg))


@router.get("/bots/{bot_id}")
def get_bot(bot_id: str, user: str = Depends(get_user)):
    bot = bots.get_bot(user, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    return bot


@router.put("/bots/{bot_id}")
def update_bot(bot_id: str, body: BotIn, user: str = Depends(get_user)):
    cfg = _clean(body)
    if not bots.update_bot(user, bot_id, cfg):
        raise HTTPException(404, "Bot not found")
    return bots.get_bot(user, bot_id)


@router.delete("/bots/{bot_id}")
def delete_bot(bot_id: str, user: str = Depends(get_user)):
    if not bots.delete_bot(user, bot_id):
        raise HTTPException(404, "Bot not found")
    return {"ok": True}


@router.delete("/data")
def delete_all_data(user: str = Depends(get_user)):
    bots.delete_all(user)
    return {"ok": True}