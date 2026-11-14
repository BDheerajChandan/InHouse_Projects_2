# backend/app/schemas.py
from typing import Optional

from pydantic import BaseModel, Field


class BotIn(BaseModel):
    assistant_type: str
    relationship_persona: Optional[str] = None
    display_name: str = Field(max_length=60)
    personality_traits: list[str] = Field(max_length=20)
    conversation_style: str
    preferred_language: str = Field("English", max_length=40)
    response_length: str = "Balanced"
    greeting: str = Field("", max_length=300)
    custom_prompt: str = Field("", max_length=1500)
    provider: str = Field(max_length=40)
    model: str = Field(max_length=100)
    token_budget: int = 3000
    memory_mode: str
    adult_confirmed: bool = False


class ChatIn(BaseModel):
    content: str = Field("", max_length=4000)
    request_id: str = Field(min_length=8, max_length=64)
    regenerate: bool = False


class MemoryIn(BaseModel):
    content: str = Field(min_length=2, max_length=200)