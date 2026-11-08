# backend/app/database/schema.py
from app.database.connection import db, ensure_database

SCHEMA = """
CREATE TABLE IF NOT EXISTS bots(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  assistant_type TEXT NOT NULL,
  relationship_persona TEXT,
  display_name TEXT NOT NULL,
  personality_traits TEXT NOT NULL,
  conversation_style TEXT NOT NULL,
  preferred_language TEXT NOT NULL,
  response_length TEXT NOT NULL,
  greeting TEXT NOT NULL DEFAULT '',
  custom_prompt TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  token_budget INTEGER NOT NULL DEFAULT 3000,
  memory_mode TEXT NOT NULL,
  adult_confirmed INTEGER NOT NULL DEFAULT 0,
  configuration_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS conversations(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS bot_id TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_bot ON conversations(bot_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages(
  seq BIGSERIAL PRIMARY KEY,
  id TEXT UNIQUE NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  request_id TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_msg_req ON messages(conversation_id, request_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, seq);

CREATE TABLE IF NOT EXISTS memories(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source_conversation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE memories ADD COLUMN IF NOT EXISTS bot_id TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_mem_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_mem_bot ON memories(user_id, bot_id);

DO $$
BEGIN
  IF to_regclass('public.companions') IS NOT NULL THEN
    INSERT INTO bots(id,user_id,assistant_type,relationship_persona,display_name,personality_traits,
      conversation_style,preferred_language,response_length,greeting,custom_prompt,provider,model,
      token_budget,memory_mode,adult_confirmed,configuration_version,created_at,updated_at)
    SELECT md5(user_id),user_id,assistant_type,relationship_persona,display_name,personality_traits,
      conversation_style,preferred_language,response_length,greeting,custom_prompt,provider,model,
      token_budget,memory_mode,adult_confirmed,configuration_version,updated_at,updated_at
    FROM companions
    ON CONFLICT (id) DO NOTHING;
    UPDATE conversations SET bot_id = md5(user_id) WHERE bot_id = '';
    UPDATE memories SET bot_id = md5(user_id) WHERE bot_id = '';
    DROP TABLE companions;
  END IF;
END $$;
"""


def init_db():
    ensure_database()
    with db() as c:
        c.execute(SCHEMA)