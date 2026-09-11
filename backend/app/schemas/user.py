"""
schemas/user.py — Pydantic schemas for User data.

Schemas are different from SQLAlchemy models:
  - SQLAlchemy Model (models/user.py) = maps to a database TABLE
  - Pydantic Schema (schemas/user.py) = validates API REQUEST/RESPONSE data

We have different schemas for different purposes:
  - UserCreate  → what we accept when someone registers
  - UserLogin   → what we accept when someone logs in
  - UserOut     → what we send back (NEVER includes hashed_password!)
  - Token       → the JWT token response after login
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


# ── Register (Create Account) ──────────────────────────────────────────
class UserCreate(BaseModel):
    """Data required to create a new user account."""
    email: EmailStr          # EmailStr validates it's a proper email format
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Ensure password is at least 8 characters."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


# ── Response: What We Return About a User ──────────────────────────────
class UserOut(BaseModel):
    """Safe user data to return in API responses.
    
    Notice: NO hashed_password field — we NEVER expose that.
    """
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    # model_config with from_attributes=True allows Pydantic to read
    # data from SQLAlchemy model objects (not just dicts)
    model_config = {"from_attributes": True}


# ── JWT Token Response ─────────────────────────────────────────────────
class Token(BaseModel):
    """What we return after a successful login."""
    access_token: str
    token_type: str = "bearer"   # Standard OAuth2 token type


class TokenData(BaseModel):
    """The decoded contents of a JWT token (used internally)."""
    user_id: Optional[str] = None
