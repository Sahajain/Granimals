"""
core/security.py — Password hashing and JWT token logic.

Two concepts here:

1. PASSWORD HASHING (bcrypt)
   - When a user registers: we hash their password → store the hash
   - When a user logs in: we hash what they typed → compare with stored hash
   - The hash is ONE-WAY: you can't reverse it to get the original password
   - Even if the DB leaks, attackers can't recover passwords

2. JWT TOKENS (JSON Web Token)
   - When login succeeds, we give the user a "token" (a long string)
   - Every future request includes this token in the header
   - We verify the token on every protected route to confirm who the user is
   - The token has an expiry — after 30 minutes, they need to log in again
   
   JWT structure: header.payload.signature
   - header: algorithm used
   - payload: the data (user_id, expiry)
   - signature: proves the token wasn't tampered with
"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password Hashing ───────────────────────────────────────────────────
# CryptContext sets up bcrypt as our hashing algorithm
# bcrypt automatically adds a "salt" (random data) to prevent rainbow table attacks
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Convert a plain text password into a bcrypt hash.
    
    Example:
        "mysecret123" → "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewFBEuM..."
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain text password matches a stored hash.
    
    Used during login: user types password → we verify against stored hash.
    Returns True if match, False if wrong password.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Tokens ─────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token containing the given data.
    
    Args:
        data: A dict of claims to encode (we pass {"sub": user_id})
              "sub" = "subject" — JWT standard field for the user identifier
        expires_delta: How long the token is valid (defaults to settings value)
    
    Returns:
        A JWT string like "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    to_encode = data.copy()

    # Set expiry time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})  # Add expiry to the token payload

    # Sign the token with our SECRET_KEY using the HS256 algorithm
    # The signature proves this token was created by us and wasn't tampered with
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[str]:
    """Decode a JWT token and return the user_id (the 'sub' claim).
    
    Returns None if the token is invalid, expired, or tampered with.
    Used in deps.py to identify who is making a request.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        # JWTError covers: expired tokens, invalid signature, malformed token
        return None
