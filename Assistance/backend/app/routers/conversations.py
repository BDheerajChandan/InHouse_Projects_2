# backend/app/routers/conversations.py
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.database.connection import db
from app.database.utils import new_id, now
from app.deps import get_user, own_bot, own_conv

router = APIRouter()


@router.get("/bots/{bot_id}/conversations")
def list_conversations(bot_id: str, user: str = Depends(get_user)):
    with db() as c:
        own_bot(c, bot_id, user)
        rows = c.execute(
            "SELECT id, title, updated_at FROM conversations WHERE user_id=%s AND bot_id=%s "
            "ORDER BY updated_at DESC LIMIT 100",
            (user, bot_id),
        ).fetchall()
    return list(rows)


@router.post("/bots/{bot_id}/conversations")
def create_conversation(bot_id: str, user: str = Depends(get_user)):
    cid, t = new_id(), now()
    with db() as c:
        own_bot(c, bot_id, user)
        c.execute(
            "INSERT INTO conversations(id,user_id,bot_id,title,created_at,updated_at) VALUES(%s,%s,%s,%s,%s,%s)",
            (cid, user, bot_id, "New chat", t, t),
        )
    return {"id": cid, "title": "New chat", "updated_at": t}


@router.get("/bots/{bot_id}/conversations/{cid}/messages")
def get_messages(
    bot_id: str,
    cid: str,
    limit: int = Query(50, ge=1, le=200),
    before: Optional[int] = None,
    user: str = Depends(get_user),
):
    with db() as c:
        own_conv(c, bot_id, cid, user)
        q, args = "SELECT seq,id,role,content,created_at FROM messages WHERE conversation_id=%s", [cid]
        if before:
            q += " AND seq<%s"
            args.append(before)
        rows = c.execute(q + " ORDER BY seq DESC LIMIT %s", (*args, limit)).fetchall()
    return list(reversed(rows))


@router.post("/bots/{bot_id}/conversations/{cid}/clear")
def clear_conversation(bot_id: str, cid: str, user: str = Depends(get_user)):
    with db() as c:
        own_conv(c, bot_id, cid, user)
        c.execute("DELETE FROM messages WHERE conversation_id=%s", (cid,))
    return {"ok": True}


@router.delete("/bots/{bot_id}/conversations/{cid}")
def delete_conversation(bot_id: str, cid: str, user: str = Depends(get_user)):
    with db() as c:
        own_conv(c, bot_id, cid, user)
        c.execute("DELETE FROM conversations WHERE id=%s AND user_id=%s", (cid, user))
    return {"ok": True}