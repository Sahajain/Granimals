def test_register_success(client):
    """Registering with valid data returns 201 and user object."""
    res = client.post("/api/auth/register", json={
        "email": "user@example.com",
        "full_name": "John Doe",
        "password": "password123",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "user@example.com"
    assert data["full_name"] == "John Doe"
    assert "hashed_password" not in data   # MUST NOT leak password
    assert "id" in data                    # UUID was generated


def test_register_duplicate_email(client):
    """Registering twice with same email returns 400."""
    payload = {"email": "dup@example.com", "full_name": "Dup", "password": "password123"}
    client.post("/api/auth/register", json=payload)  # First registration
    res = client.post("/api/auth/register", json=payload)  # Duplicate
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"].lower()


def test_register_invalid_email(client):
    """Registering with invalid email returns 422 (validation error)."""
    res = client.post("/api/auth/register", json={
        "email": "not-an-email",
        "full_name": "Test",
        "password": "password123",
    })
    assert res.status_code == 422  # Pydantic validation error


def test_register_short_password(client):
    """Password shorter than 8 chars returns 422."""
    res = client.post("/api/auth/register", json={
        "email": "short@example.com",
        "full_name": "Short",
        "password": "abc",  # only 3 chars
    })
    assert res.status_code == 422


def test_login_success(client):
    """Valid login returns JWT token."""
    # First register
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "full_name": "Login User",
        "password": "password123",
    })

    # Then login
    res = client.post("/api/auth/login", data={
        "username": "login@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20   # token should be a real JWT


def test_login_wrong_password(client):
    """Wrong password returns 401."""
    client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "full_name": "Wrong",
        "password": "correctpass",
    })
    res = client.post("/api/auth/login", data={
        "username": "wrong@example.com",
        "password": "wrongpass",
    })
    assert res.status_code == 401


def test_login_nonexistent_user(client):
    """Login with email that doesn't exist returns 401 (not 404)."""
    res = client.post("/api/auth/login", data={
        "username": "nobody@example.com",
        "password": "password123",
    })
    # Must return 401 (not 404) — prevent account enumeration
    assert res.status_code == 401


def test_get_me(client, auth_headers):
    """GET /me with valid token returns current user."""
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test@test.com"


def test_get_me_no_token(client):
    """GET /me without token returns 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_get_me_invalid_token(client):
    """GET /me with fake token returns 401."""
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer faketoken"})
    assert res.status_code == 401
