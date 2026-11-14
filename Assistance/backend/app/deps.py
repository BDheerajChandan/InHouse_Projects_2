# backend/app/deps.py
import re
import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException

_UID = re.compile(r"^[A-Za-z0-9-]{16,64}$")
_hits: dict[str, deque] = defaultdict(deque)


def get_user(x_user_id: str = Header(...)) -> str:
    if not _UID.match(x_user_id):
        raise HTTPException(400, "Invalid user id")
    return x_user_id


def rate_limit(user: str, limit: int = 20, window: int = 60):
    q, t = _hits[user], time.monotonic()
    while q and t - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, "Too many requests. Please slow down.")
    q.append(t)


def own_bot(c, bot_id: str, user: str):
    if not c.execute("SELECT 1 FROM bots WHERE id=%s AND user_id=%s", (bot_id, user)).fetchone():
        raise HTTPException(404, "Bot not found")


def own_conv(c, bot_id: str, cid: str, user: str):
    if not c.execute(
        "SELECT 1 FROM conversations WHERE id=%s AND bot_id=%s AND user_id=%s", (cid, bot_id, user)
    ).fetchone():
        raise HTTPException(404, "Conversation not found")