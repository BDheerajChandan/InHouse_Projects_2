# backend/app/config/settings.py
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _bool(v: str | None, default: bool) -> bool:
    return default if not v else v.strip().lower() in ("1", "true", "yes", "on")


class Settings:
    HOST = os.getenv("HOST") or "0.0.0.0"
    PORT = int(os.getenv("PORT") or 8002)
    RELOAD = _bool(os.getenv("RELOAD"), True)

    DB_HOST = os.getenv("DB_HOST") or "localhost"
    DB_PORT = int(os.getenv("DB_PORT") or 5432)
    DB_NAME = os.getenv("DB_NAME") or "companion"
    DB_USER = os.getenv("DB_USER") or "postgres"
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    CORS_ORIGINS = [o.strip() for o in (os.getenv("CORS_ORIGINS") or "http://localhost:5173").split(",") if o.strip()]

    LLM_TIMEOUT = 60.0
    DEFAULT_TOKEN_BUDGET = 3000
    MIN_TOKEN_BUDGET = 500
    MAX_TOKEN_BUDGET = 32000
    MODELS_CACHE_TTL = 300


settings = Settings()
