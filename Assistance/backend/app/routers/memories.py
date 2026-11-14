# backend/app/routers/memories.py
from fastapi import APIRouter, Depends, HTTPException

from app.database.connection import db
from app.deps import get_user, own_bot
from app.schemas import MemoryIn
from app.services import memory

router = APIRouter()


def _check(bot_id: str, user: str):
    with db() as c:
        own_bot(c, bot_id, user)


@router.get("/bots/{bot_id}/memories")
def get_memories(bot_id: str, user: str = Depends(get_user)):
    _check(bot_id, user)
    return memory.list_memories(user, bot_id)


@router.patch("/bots/{bot_id}/memories/{mid}")
def patch_memory(bot_id: str, mid: str, body: MemoryIn, user: str = Depends(get_user)):
    _check(bot_id, user)
    if not memory.update_memory(user, bot_id, mid, body.content.strip()):
        raise HTTPException(404, "Memory not found")
    return {"ok": True}


@router.delete("/bots/{bot_id}/memories/{mid}")
def remove_memory(bot_id: str, mid: str, user: str = Depends(get_user)):
    _check(bot_id, user)
    if not memory.delete_memory(user, bot_id, mid):
        raise HTTPException(404, "Memory not found")
    return {"ok": True}


@router.delete("/bots/{bot_id}/memories")
def remove_all_memories(bot_id: str, user: str = Depends(get_user)):
    _check(bot_id, user)
    memory.clear_memories(user, bot_id)
    return {"ok": True}