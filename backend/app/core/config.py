"""
config.py — Application settings loaded from the .env file.

How it works:
- pydantic-settings reads the .env file automatically
- Each field here maps to a variable in .env
- If a required variable is missing, the app crashes on startup (good! fail fast)
- Access settings anywhere: from app.core.config import settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────
    # Full connection string for PostgreSQL
    # postgresql://user:password@host:port/database
    DATABASE_URL: str

    # ── JWT Auth ──────────────────────────────────────────────────────
    # Used to sign and verify login tokens
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── App ───────────────────────────────────────────────────────────
    APP_NAME: str = "Customer Management System"
    DEBUG: bool = False

    # Tell pydantic-settings to read from backend/.env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Create a single instance — import this everywhere instead of recreating
# This is the "Singleton" pattern: one shared settings object
settings = Settings()
