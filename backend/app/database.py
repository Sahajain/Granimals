"""
database.py — Connects our app to PostgreSQL using SQLAlchemy.

Key concepts:
- Engine: The actual connection to the DB (like a phone line)
- SessionLocal: A "session" is one conversation with the DB (like a phone call)
- Base: All our models (tables) inherit from this — SQLAlchemy uses it to know what tables exist
- get_db(): A "dependency" — FastAPI calls this automatically to give each request its own DB session
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# ── Engine ─────────────────────────────────────────────────────────────
# The engine manages the actual connection pool to PostgreSQL.
# connection_args is only needed for SQLite (not PostgreSQL), but we set
# pool_pre_ping=True so SQLAlchemy checks connections are alive before using them.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # Check connection is alive before each query
    pool_size=10,         # Keep up to 10 connections open at once
    max_overflow=20,      # Allow up to 20 extra connections under heavy load
)

# ── Session Factory ────────────────────────────────────────────────────
# SessionLocal is a "class" (factory) that creates DB sessions.
# autocommit=False → we control when to save (commit) changes
# autoflush=False  → don't auto-send SQL to DB before we're ready
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Base Class ─────────────────────────────────────────────────────────
# All SQLAlchemy models will inherit from this Base.
# It's how SQLAlchemy knows which Python classes are database tables.
Base = declarative_base()


# ── Dependency: get_db ─────────────────────────────────────────────────
# This function is a FastAPI "dependency" — it's injected into route handlers.
# 
# How it works:
#   1. FastAPI calls get_db() before your route function runs
#   2. It creates a fresh DB session for that request
#   3. Your route function uses it to query the DB
#   4. After the request is done, the session is closed (finally block)
#
# The "yield" keyword makes this a generator — code after yield runs on cleanup.
def get_db():
    db = SessionLocal()
    try:
        yield db          # Give the session to the route handler
    finally:
        db.close()        # Always close, even if an error occurred
