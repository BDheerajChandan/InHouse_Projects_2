# backend/app/services/llm.py
import asyncio
import json

import httpx

from app.config.settings import settings
from app.services import providers
from app.services.errors import LLMError


def _status_msg(code: int) -> str:
    if code in (401, 403):
        return "The AI provider rejected the API key."
    if code == 404:
        return "The selected model was not found for this provider."
    if code == 429:
        return "The AI provider rate limit was reached. Try again shortly."
    return f"The AI provider returned an error ({code})."


async def stream_chat(provider: str, model: str, messages: list[dict]):
    base_url, api_key = providers.resolve(provider)
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
    payload = {"model": model, "messages": messages, "stream": True, "temperature": 0.8}
    timeout = httpx.Timeout(settings.LLM_TIMEOUT, connect=10)
    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(2):
            try:
                async with client.stream(
                    "POST", f"{base_url}/chat/completions", json=payload, headers=headers
                ) as r:
                    if r.status_code in (429, 500, 502, 503, 504) and attempt == 0:
                        await asyncio.sleep(1.5)
                        continue
                    if r.status_code != 200:
                        raise LLMError(_status_msg(r.status_code))
                    async for line in r.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            break
                        try:
                            delta = json.loads(data)["choices"][0]["delta"].get("content")
                        except (KeyError, IndexError, TypeError, json.JSONDecodeError):
                            continue
                        if delta:
                            yield delta
                    return
            except httpx.HTTPError:
                raise LLMError("The AI provider is unreachable or timed out.")


async def complete(provider: str, model: str, messages: list[dict]) -> str:
    out = ""
    async for d in stream_chat(provider, model, messages):
        out += d
    return out
