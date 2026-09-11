"""
routers/auth.py — Authentication endpoints.

Endpoints:
  POST /api/auth/register  → Create a new account
  POST /api/auth/login     → Login and get a JWT token
  GET  /api/auth/me        → Get the current logged-in user's info

How login works step by step:
  1. Client sends { email, password }
  2. We find the user by email in the DB
  3. We verify the password using bcrypt
  4. If valid, we create a JWT token containing the user's ID
  5. We return the token — client stores it and sends it with every future request
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserOut
from app.core.security import create_access_token, hash_password, verify_password

# APIRouter groups related endpoints together
# prefix="/api/auth" means all routes here start with /api/auth
# tags=["auth"] groups them in the auto-generated /docs page
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account.
    
    - Validates email format and password strength (via Pydantic schema)
    - Checks email isn't already taken
    - Hashes the password before storing
    - Returns the new user (without the password)
    """
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Create the user with a HASHED password (never store plain text!)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Reload to get auto-generated id, created_at, etc.
    return new_user


@router.post("/login", response_model=Token)
def login(
    # OAuth2PasswordRequestForm expects: { username, password } as FORM data
    # We use 'username' field but treat it as email (OAuth2 standard)
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login and receive a JWT access token.
    
    Returns a Bearer token to use in the Authorization header:
        Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    
    Security note: We return the SAME error for "user not found" and "wrong password"
    This prevents attackers from knowing which emails are registered (enumeration attack).
    """
    # Generic error — same for both "not found" and "wrong password"
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise invalid_credentials

    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise invalid_credentials

    # Check account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled",
        )

    # Create JWT token — store user ID as the "subject"
    # str(user.id) because UUID isn't JSON-serializable directly
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get the currently logged-in user's profile.
    
    No DB query needed — get_current_active_user already fetched the user.
    This is a common pattern to let the frontend know who is logged in.
    """
    return current_user
