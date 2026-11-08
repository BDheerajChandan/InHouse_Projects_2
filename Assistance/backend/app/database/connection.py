# backend/app/database/connection.py
from contextlib import contextmanager

import psycopg
from psycopg import sql
from psycopg.rows import dict_row

from app.config.settings import settings


def _connect(dbname: str, **kw):
    return psycopg.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        dbname=dbname,
        **kw,
    )


@contextmanager
def db():
    conn = _connect(settings.DB_NAME, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def ensure_database():
    with _connect("postgres", autocommit=True) as c:
        exists = c.execute("SELECT 1 FROM pg_database WHERE datname=%s", (settings.DB_NAME,)).fetchone()
        if not exists:
            c.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(settings.DB_NAME)))
