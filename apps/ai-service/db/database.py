"""
database.py
-----------
Establishes a SQLAlchemy connection to PostgreSQL using DATABASE_URL from .env.
All other modules import `engine` and `get_db_connection` from here.
"""

import os
import logging
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

AI_SERVICE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_SERVICE_ROOT.parents[1]

# Load the service-local env first, then allow the repo root .env to fill gaps.
load_dotenv(AI_SERVICE_ROOT / ".env")
load_dotenv(REPO_ROOT / ".env")

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5433/hackathon_db?schema=public",
)

# SQLAlchemy uses 'postgresql+psycopg2://' but Prisma uses 'postgresql://'.
# Normalise both forms so the same .env works for both.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

url_parts = urlsplit(DATABASE_URL)
query_params = dict(parse_qsl(url_parts.query))
DB_SCHEMA = query_params.pop("schema", None)
DATABASE_URL = urlunsplit(
    (
        url_parts.scheme,
        url_parts.netloc,
        url_parts.path,
        urlencode(query_params),
        url_parts.fragment,
    )
)

connect_args = {}
if DB_SCHEMA:
    connect_args["options"] = f"-csearch_path={DB_SCHEMA}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # drop stale connections before use
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
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
