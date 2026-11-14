# backend/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.schema import init_db
from app.routers import bots, chat, conversations, memories, providers

ROUTERS = (bots, providers, conversations, chat, memories)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Personal AI Companion", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"]
)

for r in ROUTERS:
    app.include_router(r.router, prefix="/api/v1")