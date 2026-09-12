from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Full connection string for PostgreSQL
    # postgresql://user:password@host:port/database
    DATABASE_URL: str

    # Used to sign and verify login tokens
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    APP_NAME: str = "Customer Management System"
    DEBUG: bool = False

    # Tell pydantic-settings to read from backend/.env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Create a single instance — import this everywhere instead of recreating
# This is the "Singleton" pattern: one shared settings object
settings = Settings()
