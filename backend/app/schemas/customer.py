"""
schemas/customer.py — Pydantic schemas for Customer data.

Pattern: we have separate schemas for Create, Update, and Response.
This gives us fine-grained control:
  - CustomerCreate: required fields only, all must be provided
  - CustomerUpdate: all fields optional (PATCH-style — update only what's sent)
  - CustomerOut:    what we return (includes computed/related fields)
  - CustomerList:   paginated list response
"""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


# ── Shared Base ────────────────────────────────────────────────────────
# Fields common to both Create and Update schemas.
# We inherit from this to avoid repeating ourselves (DRY principle).
class CustomerBase(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[Literal["active", "inactive"]] = None
    # Literal["active", "inactive"] means only these 2 values are valid


# ── Create a New Customer ──────────────────────────────────────────────
class CustomerCreate(CustomerBase):
    """Required fields when creating a customer.
    
    Overrides the optional fields from CustomerBase to make them required.
    """
    name: str               # Required — must provide a name
    email: EmailStr         # Required — must provide a valid email
    status: Literal["active", "inactive"] = "active"  # Defaults to active

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Customer name cannot be empty")
        return v.strip()


# ── Update a Customer ──────────────────────────────────────────────────
class CustomerUpdate(CustomerBase):
    """All fields optional — only send what you want to change.
    
    Example: {"status": "inactive"} → only updates status, leaves everything else
    This is a PATCH pattern (partial update) vs PUT (full replacement).
    """
    pass  # Inherits all optional fields from CustomerBase — nothing to add


# ── Response: What We Return ───────────────────────────────────────────
class CustomerOut(BaseModel):
    """Full customer data returned in API responses."""
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Paginated List Response ─────────────────────────────────────────────
class CustomerListResponse(BaseModel):
    """Wraps a list of customers with pagination metadata.
    
    Instead of returning a bare list, we include:
    - items: the customers for the current page
    - total: total number of customers (so frontend knows how many pages)
    - page: current page number
    - size: items per page
    - pages: total number of pages
    """
    items: List[CustomerOut]
    total: int       # Total matching records
    page: int        # Current page (1-indexed)
    size: int        # Items per page
    pages: int       # Total number of pages
