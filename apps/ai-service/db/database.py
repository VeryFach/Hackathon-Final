"""
database.py
-----------
Establishes a SQLAlchemy connection to PostgreSQL using DATABASE_URL from .env.
All other modules import `engine` and `get_db_connection` from here.
"""

import os
import logging
from contextlib import contextmanager

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()  # loads .env from the project root

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Add it to your .env file: DATABASE_URL=postgresql://user:pass@host:port/dbname"
    )

# SQLAlchemy uses 'postgresql+psycopg2://' but Prisma uses 'postgresql://'.
# Normalise both forms so the same .env works for both.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # drop stale connections before use
    pool_size=5,
    max_overflow=10,
    echo=False,           # set True for SQL debug logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db_connection():
    """
    Context manager that yields a raw DBAPI connection.
    Use this for pd.read_sql() calls.

    Usage:
        with get_db_connection() as conn:
            df = pd.read_sql(query, conn)
    """
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()


def ping() -> bool:
    """Return True if the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database ping failed: %s", exc)
        return False