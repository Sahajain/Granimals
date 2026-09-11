"""
models/user.py — The 'users' table definition.

This Python class maps directly to a database table called 'users'.
Every attribute with Column() becomes a column in that table.

Why store passwords as hashed_password?
  NEVER store plain text passwords. If the DB leaks, attackers get nothing useful.
  We store a one-way hash — we can verify a password but can't reverse it.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    # __tablename__ tells SQLAlchemy what to name the table in PostgreSQL
    __tablename__ = "users"

    # ── Primary Key ────────────────────────────────────────────────────
    # UUID = Universally Unique Identifier (like: f47ac10b-58cc-4372-a567-0e02b2c3d479)
    # Why UUID instead of 1, 2, 3...?
    #   - Can be generated without asking the DB first
    #   - Impossible to guess/enumerate (security)
    #   - Works across distributed systems
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,   # Auto-generate a UUID when a new user is created
        index=True,
    )

    # ── User Info ──────────────────────────────────────────────────────
    email = Column(
        String(255),
        unique=True,    # No two users can have the same email
        nullable=False, # Cannot be empty
        index=True,     # Index = fast lookups. Without this, DB scans ALL rows to find by email
    )

    full_name = Column(String(255), nullable=False)

    # We NEVER store the actual password — only the bcrypt hash
    hashed_password = Column(Text, nullable=False)

    # ── Flags ──────────────────────────────────────────────────────────
    is_active = Column(Boolean, default=True)   # Soft disable accounts without deleting

    # Role-based access control (RBAC) — bonus feature!
    # 'user'  → can view/manage customers
    # 'admin' → can do everything including manage other users
    role = Column(String(50), default="user", nullable=False)

    # ── Timestamps ─────────────────────────────────────────────────────
    # datetime.utcnow (without calling it) → SQLAlchemy calls it each time a row is inserted
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationship ───────────────────────────────────────────────────
    # This tells SQLAlchemy: "A User can have many Customers"
    # It doesn't create a column — it lets us do user.customers to get all their customers
    customers = relationship("Customer", back_populates="created_by_user")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
