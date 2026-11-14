# backend/app/routers/chat.py
import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from psycopg.errors import UniqueViolation

from app.database.connection import db
from app.database.utils import new_id, now
from app.deps import get_user, own_conv, rate_limit
from app.schemas import ChatIn
from app.services import bots, memory, persona
from app.services.errors import LLMError
from app.services.llm import stream_chat

router = APIRouter()


def _sse(o: dict) -> str:
    return f"data: {json.dumps(o)}\n\n"


@router.post("/bots/{bot_id}/conversations/{cid}/chat")
async def chat(bot_id: str, cid: str, body: ChatIn, user: str = Depends(get_user)):
    rate_limit(user)
    cfg = bots.get_bot(user, bot_id)
    if not cfg:
        raise HTTPException(404, "Bot not found")
    if not cfg["provider"] or not cfg["model"]:
        raise HTTPException(400, "Open Settings and choose an AI provider and model")

    with db() as c:
        own_conv(c, bot_id, cid, user)
        if body.regenerate:
            last = c.execute(
                "SELECT seq, content FROM messages WHERE conversation_id=%s AND role='user' "
                "ORDER BY seq DESC LIMIT 1",
                (cid,),
            ).fetchone()
            if not last:
                raise HTTPException(400, "Nothing to regenerate")
            c.execute("DELETE FROM messages WHERE conversation_id=%s AND seq>%s", (cid, last["seq"]))
            text = last["content"]
        else:
            text = body.content.strip()
            if not text:
                raise HTTPException(422, "Message is empty")
            try:
                c.execute(
                    "INSERT INTO messages(id,conversation_id,role,content,request_id,created_at) "
                    "VALUES(%s,%s,%s,%s,%s,%s)",
                    (new_id(), cid, "user", text, body.request_id, now()),
                )
            except UniqueViolation:
                raise HTTPException(409, "Duplicate request")
            c.execute(
                "UPDATE conversations SET updated_at=%s, "
                "title=CASE WHEN title='New chat' THEN %s ELSE title END WHERE id=%s",
                (now(), text[:40], cid),
            )
        c.execute("UPDATE bots SET updated_at=%s WHERE id=%s", (now(), bot_id))

    mode, provider, model = cfg["memory_mode"], cfg["provider"], cfg["model"]
    mems = memory.retrieve(user, bot_id, text) if mode == "long_term" else []
    history = (
        [{"role": "user", "content": text}]
        if mode == "disabled"
        else memory.session_history(cid, cfg["token_budget"])
    )
    ctx = [{"role": "system", "content": persona.build_system_prompt(cfg, mems)}] + history

    def save_reply(content: str) -> str:
        mid = new_id()
        with db() as c:
            c.execute(
                "INSERT INTO messages(id,conversation_id,role,content,created_at) VALUES(%s,%s,%s,%s,%s)",
                (mid, cid, "assistant", content, now()),
            )
        return mid

    async def gen():
        parts: list[str] = []
        try:
            async for d in stream_chat(provider, model, ctx):
                parts.append(d)
                yield _sse({"type": "delta", "text": d})
            full = "".join(parts).strip()
            if not full:
                raise LLMError("The AI provider returned an empty response.")
            mid = save_reply(full)
            yield _sse({"type": "done", "id": mid})
            if mode == "long_term":
                memory.spawn(memory.extract(user, bot_id, cid, text, provider, model))
        except LLMError as e:
            yield _sse({"type": "error", "message": str(e)})
        except asyncio.CancelledError:
            if parts:
                save_reply("".join(parts))
            raise
        except Exception:
            yield _sse({"type": "error", "message": "Something went wrong while generating a reply."})

    return StreamingResponse(
        gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )