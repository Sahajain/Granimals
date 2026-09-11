"""
tests/conftest.py — Shared pytest fixtures.

"Fixtures" = reusable setup code that tests can use.
Like a `beforeEach` in Jest (JavaScript testing).

Here we create:
- A temporary in-memory SQLite database for tests
  (we don't touch the real PostgreSQL DB)
- An overridden get_db that uses the test DB
- An HTTP test client (TestClient) for making API calls
- A helper to create users and get auth tokens

Why SQLite for tests?
  - No installation needed, runs in RAM
  - Each test run gets a fresh DB (no leftover data)
  - Tests run in parallel without conflicts
  - Real app uses PostgreSQL — SQLite is close enough for logic tests
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# ── In-memory SQLite for tests ─────────────────────────────────────────
# "check_same_thread=False" allows SQLite to be used across threads
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # Reuse same connection (needed for in-memory SQLite)
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Override get_db ────────────────────────────────────────────────────
# Replace the real DB dependency with our test DB for every test
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ── Fixtures ───────────────────────────────────────────────────────────
@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """HTTP test client — acts like a browser calling our API."""
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """
    Create a test user, log in, return the Authorization header.
    
    Usage in tests:
        def test_something(client, auth_headers):
            res = client.get("/api/customers", headers=auth_headers)
    """
    # Register
    client.post("/api/auth/register", json={
        "email": "test@test.com",
        "full_name": "Test User",
        "password": "testpass123",
    })

    # Login → get token
    res = client.post("/api/auth/login", data={
        "username": "test@test.com",
        "password": "testpass123",
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
