# backend/app/services/providers.py
import re
import time

import httpx

from app.config.providers import PROVIDERS, api_key
from app.config.settings import settings
from app.services.errors import LLMError

_cache: dict[str, tuple[float, list[str]]] = {}


def key_preview(key: str) -> str:
    if not key:
        return ""
    return f"{key[:3]}…{key[-4:]}" if len(key) > 10 else "••••"


def list_providers() -> list[dict]:
    out = []
    for pid, spec in PROVIDERS.items():
        key = api_key(pid)
        out.append(
            {"id": pid, "label": spec["label"], "configured": bool(key), "key_preview": key_preview(key)}
        )
    return out


def is_configured(pid: str) -> bool:
    return pid in PROVIDERS and bool(api_key(pid))


def resolve(pid: str) -> tuple[str, str]:
    spec = PROVIDERS.get(pid)
    if not spec:
        raise LLMError("Unknown AI provider.")
    key = api_key(pid)
    if not key:
        raise LLMError(f"{spec['label']} API key is not set in backend/.env.")
    return spec["base_url"], key


async def fetch_models(pid: str, refresh: bool = False) -> list[str]:
    hit = _cache.get(pid)
    if hit and not refresh and time.monotonic() - hit[0] < settings.MODELS_CACHE_TTL:
        return hit[1]
    base, key = resolve(pid)
    spec = PROVIDERS[pid]
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"})
    except httpx.HTTPError:
        raise LLMError("Could not reach the AI provider to list models.")
    if r.status_code in (401, 403):
        raise LLMError("The AI provider rejected the API key.")
    if r.status_code != 200:
        raise LLMError(f"The AI provider returned an error ({r.status_code}).")
    try:
        data = r.json().get("data", [])
    except ValueError:
        data = []
    inc, exc = re.compile(spec["include"]), re.compile(spec["exclude"])
    ids = {str(m.get("id", "")).removeprefix("models/") for m in data if isinstance(m, dict)}
    models = sorted(i for i in ids if i and inc.search(i) and not exc.search(i))
    _cache[pid] = (time.monotonic(), models)
    return models
