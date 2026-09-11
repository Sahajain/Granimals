"""
tests/test_customers.py — Tests for customer CRUD endpoints.

Tests cover the full lifecycle: create → list → get → update → delete
Also tests: unauthenticated access, search, pagination, 404 handling.
"""

import pytest


# ── Helper ─────────────────────────────────────────────────────────────
def create_customer(client, auth_headers, **overrides):
    """Create a customer and return the response JSON."""
    payload = {
        "name": "Test Customer",
        "email": "customer@test.com",
        "phone": "+91-9876543210",
        "company": "Test Corp",
        "status": "active",
        **overrides,
    }
    res = client.post("/api/customers", json=payload, headers=auth_headers)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    return res.json()


# ── Unauthenticated Access ─────────────────────────────────────────────
def test_list_customers_requires_auth(client):
    """Accessing customers without a token returns 401."""
    res = client.get("/api/customers")
    assert res.status_code == 401


def test_create_customer_requires_auth(client):
    """Creating a customer without a token returns 401."""
    res = client.post("/api/customers", json={"name": "X", "email": "x@x.com"})
    assert res.status_code == 401


# ── Create ─────────────────────────────────────────────────────────────
def test_create_customer_success(client, auth_headers):
    """Creating a customer with valid data returns 201 and the customer."""
    res = client.post("/api/customers", json={
        "name": "John Doe",
        "email": "john@acme.com",
        "company": "Acme Corp",
        "status": "active",
    }, headers=auth_headers)

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "John Doe"
    assert data["email"] == "john@acme.com"
    assert data["company"] == "Acme Corp"
    assert data["status"] == "active"
    assert "id" in data
    assert "created_at" in data


def test_create_customer_duplicate_email(client, auth_headers):
    """Creating two customers with the same email returns 400."""
    create_customer(client, auth_headers, email="dup@acme.com")
    res = client.post("/api/customers", json={
        "name": "Another",
        "email": "dup@acme.com",
        "status": "active",
    }, headers=auth_headers)
    assert res.status_code == 400


def test_create_customer_invalid_status(client, auth_headers):
    """Creating a customer with invalid status returns 422."""
    res = client.post("/api/customers", json={
        "name": "Bad",
        "email": "bad@test.com",
        "status": "invalid_status",   # Not in ["active", "inactive", "prospect"]
    }, headers=auth_headers)
    assert res.status_code == 422


def test_create_customer_missing_name(client, auth_headers):
    """Creating a customer without name returns 422."""
    res = client.post("/api/customers", json={
        "email": "noname@test.com",
        "status": "active",
    }, headers=auth_headers)
    assert res.status_code == 422


# ── List ───────────────────────────────────────────────────────────────
def test_list_customers_empty(client, auth_headers):
    """Listing when there are no customers returns empty paginated result."""
    res = client.get("/api/customers", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_list_customers_returns_all(client, auth_headers):
    """Creating 3 customers → listing returns all 3."""
    create_customer(client, auth_headers, email="c1@test.com", name="Alpha")
    create_customer(client, auth_headers, email="c2@test.com", name="Beta")
    create_customer(client, auth_headers, email="c3@test.com", name="Gamma")

    res = client.get("/api/customers", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3


def test_list_customers_search(client, auth_headers):
    """Search by name filters correctly."""
    create_customer(client, auth_headers, email="john@test.com", name="John Smith")
    create_customer(client, auth_headers, email="jane@test.com", name="Jane Doe")

    res = client.get("/api/customers?search=john", headers=auth_headers)
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "John Smith"


def test_list_customers_filter_by_status(client, auth_headers):
    """Filter by status returns only matching customers."""
    create_customer(client, auth_headers, email="active@test.com", status="active")
    create_customer(client, auth_headers, email="inactive@test.com", status="inactive")
    create_customer(client, auth_headers, email="prospect@test.com", status="prospect")

    res = client.get("/api/customers?status=active", headers=auth_headers)
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "active"


def test_list_customers_pagination(client, auth_headers):
    """Pagination: size=2 returns 2 items, page 2 returns the rest."""
    for i in range(5):
        create_customer(client, auth_headers, email=f"c{i}@test.com", name=f"Customer {i}")

    # Page 1: 2 items
    res = client.get("/api/customers?page=1&size=2", headers=auth_headers)
    data = res.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["pages"] == 3   # ceil(5/2) = 3

    # Page 3: 1 remaining item
    res2 = client.get("/api/customers?page=3&size=2", headers=auth_headers)
    assert len(res2.json()["items"]) == 1


# ── Get One ────────────────────────────────────────────────────────────
def test_get_customer_by_id(client, auth_headers):
    """Getting an existing customer by ID returns the customer."""
    created = create_customer(client, auth_headers)
    res = client.get(f"/api/customers/{created['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_get_customer_not_found(client, auth_headers):
    """Getting a non-existent UUID returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = client.get(f"/api/customers/{fake_id}", headers=auth_headers)
    assert res.status_code == 404


# ── Update ─────────────────────────────────────────────────────────────
def test_update_customer(client, auth_headers):
    """Updating a customer changes only the specified fields."""
    created = create_customer(client, auth_headers)

    res = client.put(
        f"/api/customers/{created['id']}",
        json={"status": "inactive", "company": "New Corp"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "inactive"
    assert data["company"] == "New Corp"
    assert data["name"] == created["name"]   # Unchanged fields preserved


def test_update_customer_not_found(client, auth_headers):
    """Updating a non-existent UUID returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = client.put(
        f"/api/customers/{fake_id}",
        json={"status": "inactive"},
        headers=auth_headers,
    )
    assert res.status_code == 404


# ── Delete ─────────────────────────────────────────────────────────────
def test_delete_customer(client, auth_headers):
    """Deleting a customer returns 204 and the customer no longer exists."""
    created = create_customer(client, auth_headers)

    # Delete
    res = client.delete(f"/api/customers/{created['id']}", headers=auth_headers)
    assert res.status_code == 204

    # Verify it's gone
    get_res = client.get(f"/api/customers/{created['id']}", headers=auth_headers)
    assert get_res.status_code == 404


def test_delete_customer_not_found(client, auth_headers):
    """Deleting a non-existent UUID returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = client.delete(f"/api/customers/{fake_id}", headers=auth_headers)
    assert res.status_code == 404
