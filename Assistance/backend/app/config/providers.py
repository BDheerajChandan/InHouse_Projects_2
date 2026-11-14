# backend/app/config/providers.py
import os

# Add a provider = add one entry (any OpenAI-compatible API)
PROVIDERS = {
    "openai": {
        "label": "OpenAI",
        "env": "OPENAI_API_KEY",
        "base_url": "https://api.openai.com/v1",
        "include": r"^(gpt-|chatgpt-|o\d)",
        "exclude": r"(embed|whisper|tts|dall-e|image|audio|realtime|transcribe|moderation|search|instruct|davinci|babbage)",
    },
    "gemini": {
        "label": "Google Gemini",
        "env": "GEMINI_API_KEY",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "include": r"^gemini",
        "exclude": r"(embed|aqa|imagen|tts|image|live|robotics)",
    },
}


def api_key(provider: str) -> str:
    spec = PROVIDERS.get(provider)
    return os.getenv(spec["env"], "").strip() if spec else ""
