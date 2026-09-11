"""
routers/customers.py — Customer CRUD endpoints.

All routes here require authentication (JWT token).
The `get_current_active_user` dependency enforces this automatically.

Endpoints:
  GET    /api/customers           → List customers (search + filter + paginate)
  GET    /api/customers/{id}      → Get one customer
  POST   /api/customers           → Create a new customer
  PUT    /api/customers/{id}      → Update a customer (partial)
  DELETE /api/customers/{id}      → Delete a customer

HTTP Status codes we use:
  200 OK          → Successful GET/PUT
  201 Created     → Successful POST (something was created)
  204 No Content  → Successful DELETE (nothing to return)
  400 Bad Request → Validation error or duplicate
  404 Not Found   → Customer doesn't exist
  401 Unauthorized→ No/invalid token
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerListResponse, CustomerOut, CustomerUpdate
from app.services import customer_service

router = APIRouter(prefix="/api/customers", tags=["Customers"])


# ── LIST: GET /api/customers ───────────────────────────────────────────
@router.get("", response_model=CustomerListResponse)
def list_customers(
    # Query params — these come from the URL: /api/customers?page=2&search=john
    page: int = Query(default=1, ge=1, description="Page number (starts at 1)"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(default=None, description="Search by name, email, or company"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    company: Optional[str] = Query(default=None, description="Filter by company"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  # 🔒 Protected
):
    """List all customers with search, filtering, and pagination.
    
    Examples:
      GET /api/customers                          → All customers, page 1
      GET /api/customers?search=acme             → Customers matching 'acme'
      GET /api/customers?status=active&page=2    → Active customers, page 2
      GET /api/customers?search=john&size=5      → Search john, 5 per page
    """
    return customer_service.get_customers(
        db=db,
        page=page,
        size=size,
        search=search,
        status=status,
        company=company,
    )


# ── GET ONE: GET /api/customers/{id} ──────────────────────────────────
@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  # 🔒 Protected
):
    """Get a single customer by their ID."""
    customer = customer_service.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id '{customer_id}' not found",
        )
    return customer


# ── CREATE: POST /api/customers ────────────────────────────────────────
@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  # 🔒 Protected
):
    """Create a new customer.
    
    Returns the created customer with a 201 status code.
    Rejects duplicate emails with a 400 error.
    """
    try:
        return customer_service.create_customer(
            db=db,
            customer_data=customer_data,
            created_by=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ── UPDATE: PUT /api/customers/{id} ────────────────────────────────────
@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: UUID,
    update_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  # 🔒 Protected
):
    """Update a customer (partial update — only send fields you want to change).
    
    Example body: {"status": "inactive"} → only updates status
    """
    customer = customer_service.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id '{customer_id}' not found",
        )

    # If email is being changed, check it's not already taken
    if update_data.email and update_data.email != customer.email:
        existing = customer_service.get_customer_by_email(db, update_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{update_data.email}' is already used by another customer",
            )

    return customer_service.update_customer(db, customer, update_data)


# ── DELETE: DELETE /api/customers/{id} ─────────────────────────────────
@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  # 🔒 Protected
):
    """Delete a customer permanently.
    
    Returns 204 No Content on success (nothing to return after deletion).
    Only admins or the user who created the customer can delete them.
    """
    customer = customer_service.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id '{customer_id}' not found",
        )

    customer_service.delete_customer(db, customer)
    # No return needed — 204 means "success, nothing to return"
