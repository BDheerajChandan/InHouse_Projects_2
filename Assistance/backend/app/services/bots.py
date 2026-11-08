# backend/app/services/bots.py
import json
from typing import Optional

from app.database.connection import db
from app.database.utils import new_id, now

MAX_BOTS = 20

FIELDS = [
    "assistant_type", "relationship_persona", "display_name", "personality_traits",
    "conversation_style", "preferred_language", "response_length", "greeting", "custom_prompt",
    "provider", "model", "token_budget", "memory_mode", "adult_confirmed",
]


def _out(r: dict) -> dict:
    d = dict(r)
    d["personality_traits"] = json.loads(d["personality_traits"])
    d["adult_confirmed"] = bool(d["adult_confirmed"])
    d.pop("user_id", None)
    return d


def _vals(cfg: dict) -> list:
    row = {
        **cfg,
        "personality_traits": json.dumps(cfg["personality_traits"]),
        "adult_confirmed": int(cfg["adult_confirmed"]),
    }
    return [row[f] for f in FIELDS]


def list_bots(user: str) -> list[dict]:
    with db() as c:
        rows = c.execute("SELECT * FROM bots WHERE user_id=%s ORDER BY updated_at DESC", (user,)).fetchall()
    return [_out(r) for r in rows]


def count_bots(user: str) -> int:
    with db() as c:
        return c.execute("SELECT COUNT(*) AS n FROM bots WHERE user_id=%s", (user,)).fetchone()["n"]


def get_bot(user: str, bot_id: str) -> Optional[dict]:
    with db() as c:
        r = c.execute("SELECT * FROM bots WHERE id=%s AND user_id=%s", (bot_id, user)).fetchone()
    return _out(r) if r else None


def create_bot(user: str, cfg: dict) -> str:
    bid, t = new_id(), now()
    cols = ",".join(FIELDS)
    marks = ",".join(["%s"] * (len(FIELDS) + 5))
    with db() as c:
        c.execute(
            f"INSERT INTO bots(id,user_id,{cols},configuration_version,created_at,updated_at) VALUES({marks})",
            (bid, user, *_vals(cfg), 1, t, t),
        )
    return bid


def update_bot(user: str, bot_id: str, cfg: dict) -> bool:
    sets = ",".join(f"{f}=%s" for f in FIELDS)
    with db() as c:
        cur = c.execute(
            f"UPDATE bots SET {sets}, configuration_version=configuration_version+1, updated_at=%s "
            "WHERE id=%s AND user_id=%s",
            (*_vals(cfg), now(), bot_id, user),
        )
        return cur.rowcount > 0


def delete_bot(user: str, bot_id: str) -> bool:
    with db() as c:
        c.execute("DELETE FROM conversations WHERE bot_id=%s AND user_id=%s", (bot_id, user))
        c.execute("DELETE FROM memories WHERE bot_id=%s AND user_id=%s", (bot_id, user))
        return c.execute("DELETE FROM bots WHERE id=%s AND user_id=%s", (bot_id, user)).rowcount > 0


def delete_all(user: str):
    with db() as c:
        c.execute("DELETE FROM conversations WHERE user_id=%s", (user,))
        c.execute("DELETE FROM memories WHERE user_id=%s", (user,))
        c.execute("DELETE FROM bots WHERE user_id=%s", (user,))