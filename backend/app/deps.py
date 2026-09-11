"""
deps.py — FastAPI dependency functions.

Dependencies are functions that FastAPI runs automatically before a route handler.
They're used for:
  1. get_db()          → Provide a DB session to every route that needs it
  2. get_current_user() → Verify the JWT token and return the logged-in User object

How to use in a route:
    @router.get("/customers")
    def list_customers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
        # `db` is a live DB session, ready to query
        # `user` is the currently logged-in User object
        ...

FastAPI handles calling these functions for you — you never call get_db() yourself.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# ── OAuth2 Scheme ──────────────────────────────────────────────────────
# This tells FastAPI:
#   "Tokens come from the Authorization header as: Bearer <token>"
#   "If someone hits a protected route without a token, redirect them to /api/auth/login"
#
# OAuth2PasswordBearer extracts the token from the "Authorization: Bearer ..." header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),  # FastAPI extracts token from header
    db: Session = Depends(get_db),        # FastAPI provides a DB session
) -> User:
    """Decode the JWT token and return the current logged-in User.
    
    This dependency is used to protect routes — any route that includes
    `user: User = Depends(get_current_user)` will require a valid token.
    
    Raises:
        401 Unauthorized — if token is missing, expired, or invalid
        401 Unauthorized — if the user in the token no longer exists
    """
    # Standard HTTP 401 exception we'll reuse
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},  # Standard auth header
    )

    # Decode the token → get user_id string
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception

    # Cast string → UUID (SQLite stores UUIDs as strings; PostgreSQL handles both)
    try:
        from uuid import UUID as UUIDType
        user_uuid = UUIDType(user_id)
    except (ValueError, AttributeError):
        raise credentials_exception

    # Look up the user in the DB
    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Same as get_current_user but also checks the account is active.
    
    Use this instead of get_current_user for most routes.
    Raises 400 if account has been disabled.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account",
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Only allows admin users through. Used for admin-only routes.
    
    Raises 403 Forbidden if user is not an admin.
    This is our RBAC (Role-Based Access Control) implementation.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# Re-export get_db so routes only need to import from deps.py
__all__ = ["get_db", "get_current_user", "get_current_active_user", "get_current_admin_user"]
