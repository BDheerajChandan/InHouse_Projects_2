# backend/app/services/memory.py
import asyncio
import json
import re

from app.database.connection import db
from app.database.utils import new_id, now
from app.services.llm import complete

CATEGORIES = {"preference", "goal", "project", "fact"}
MAX_MEMORIES = 200
SENSITIVE = re.compile(
    r"\b(health|medical|diagnos\w*|therapy|depress\w*|anxiety|sex\w*|intimate|religio\w*|politic\w*|"
    r"password|salary|bank|credit card|passport|ssn|suicid\w*|abus\w*)\b",
    re.I,
)
EXTRACT_PROMPT = (
    "Extract durable facts worth remembering from the user's message: stable preferences, preferred "
    "language, communication style, goals, ongoing projects. Only facts the user explicitly stated. "
    "Never include sensitive or intimate details (health, sexuality, finances, religion, politics, "
    "identifiers, passwords, trauma). Return ONLY a JSON array (max 3) of "
    '{"content": "short third-person statement", "category": "preference|goal|project|fact"}. '
    "Return [] if nothing qualifies."
)


def _tok(s: str) -> set[str]:
    return {w for w in re.findall(r"\w+", s.lower()) if len(w) > 2}


def _norm(s: str) -> str:
    return re.sub(r"\W+", " ", s.lower()).strip()


def session_history(conversation_id: str, token_budget: int) -> list[dict]:
    with db() as c:
        rows = c.execute(
            "SELECT role, content FROM messages WHERE conversation_id=%s ORDER BY seq DESC LIMIT 200",
            (conversation_id,),
        ).fetchall()
    out, used = [], 0
    for r in rows:
        t = max(1, len(r["content"]) // 4)
        if out and used + t > token_budget:
            break
        out.append({"role": r["role"], "content": r["content"]})
        used += t
    return out[::-1]


def retrieve(user_id: str, bot_id: str, query: str, limit: int = 5) -> list[str]:
    q = _tok(query)
    with db() as c:
        rows = c.execute(
            "SELECT category, content FROM memories WHERE user_id=%s AND bot_id=%s", (user_id, bot_id)
        ).fetchall()
    scored = []
    for r in rows:
        s = len(q & _tok(r["content"]))
        if s > 0 or r["category"] == "preference":
            scored.append((s, r["content"]))
    scored.sort(key=lambda x: -x[0])
    return [t for _, t in scored[:limit]]


def upsert(user_id: str, bot_id: str, conversation_id: str | None, category: str, content: str):
    n, toks = _norm(content), _tok(content)
    with db() as c:
        rows = c.execute(
            "SELECT id, content FROM memories WHERE user_id=%s AND bot_id=%s", (user_id, bot_id)
        ).fetchall()
        for r in rows:
            other = _tok(r["content"])
            union = toks | other
            if _norm(r["content"]) == n or (union and len(toks & other) / len(union) >= 0.6):
                c.execute(
                    "UPDATE memories SET content=%s, category=%s, updated_at=%s WHERE id=%s AND user_id=%s",
                    (content, category, now(), r["id"], user_id),
                )
                return
        if len(rows) >= MAX_MEMORIES:
            return
        t = now()
        c.execute(
            "INSERT INTO memories(id,user_id,bot_id,category,content,source_conversation_id,created_at,updated_at) "
            "VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
            (new_id(), user_id, bot_id, category, content, conversation_id, t, t),
        )


async def extract(user_id: str, bot_id: str, conversation_id: str, user_text: str, provider: str, model: str):
    try:
        raw = await complete(
            provider,
            model,
            [{"role": "system", "content": EXTRACT_PROMPT}, {"role": "user", "content": user_text}],
        )
        items = json.loads(raw[raw.index("["): raw.rindex("]") + 1])
        for it in items[:3]:
            if not isinstance(it, dict):
                continue
            content = str(it.get("content", "")).strip()[:200]
            cat = it.get("category")
            if cat in CATEGORIES and len(content) >= 4 and not SENSITIVE.search(content):
                upsert(user_id, bot_id, conversation_id, cat, content)
    except Exception:
        return  # extraction is best-effort and must never break chat


def list_memories(user_id: str, bot_id: str) -> list[dict]:
    with db() as c:
        rows = c.execute(
            "SELECT id, category, content, updated_at FROM memories "
            "WHERE user_id=%s AND bot_id=%s ORDER BY updated_at DESC",
            (user_id, bot_id),
        ).fetchall()
    return list(rows)


def update_memory(user_id: str, bot_id: str, mid: str, content: str) -> bool:
    with db() as c:
        cur = c.execute(
            "UPDATE memories SET content=%s, updated_at=%s WHERE id=%s AND user_id=%s AND bot_id=%s",
            (content, now(), mid, user_id, bot_id),
        )
        return cur.rowcount > 0


def delete_memory(user_id: str, bot_id: str, mid: str) -> bool:
    with db() as c:
        return (
            c.execute(
                "DELETE FROM memories WHERE id=%s AND user_id=%s AND bot_id=%s", (mid, user_id, bot_id)
            ).rowcount
            > 0
        )


def clear_memories(user_id: str, bot_id: str):
    with db() as c:
        c.execute("DELETE FROM memories WHERE user_id=%s AND bot_id=%s", (user_id, bot_id))


_tasks: set = set()


def spawn(coro):
    t = asyncio.create_task(coro)
    _tasks.add(t)
    t.add_done_callback(_tasks.discard)