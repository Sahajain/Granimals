import math
from typing import Optional
from uuid import UUID

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerListResponse, CustomerOut, CustomerUpdate


def get_customers(
    db: Session,
    page: int = 1,
    size: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    company: Optional[str] = None,
) -> CustomerListResponse:
    """Get a paginated, searchable, filterable list of customers.
    
    Args:
        db:      Database session
        page:    Page number (1-indexed)
        size:    Items per page (max 100)
        search:  Search string — matches name, email, or company
        status:  Filter by status ('active', 'inactive', 'prospect')
        company: Filter by exact company name
    
    Returns:
        CustomerListResponse with items + pagination metadata
    """
    # Start with a base query — "SELECT * FROM customers"
    query = db.query(Customer)

    # or_() = SQL OR: WHERE name ILIKE '%term%' OR email ILIKE '%term%' OR company ILIKE '%term%'
    # ILIKE = case-insensitive LIKE (PostgreSQL specific)
    if search:
        search_term = f"%{search}%"   # % is the SQL wildcard
        query = query.filter(
            or_(
                Customer.name.ilike(search_term),
                Customer.email.ilike(search_term),
                Customer.company.ilike(search_term),
            )
        )

    if status:
        query = query.filter(Customer.status == status)

    if company:
        query = query.filter(Customer.company.ilike(f"%{company}%"))

    # We need total count to calculate number of pages
    total = query.count()

    # Show newest customers first
    query = query.order_by(Customer.created_at.desc())

    # OFFSET = skip the first N records
    # LIMIT  = return at most N records
    # Example: page=2, size=10 → skip 10, take 10 → rows 11-20
    size = min(size, 100)    # Cap at 100 items per page (prevent abuse)
    offset = (page - 1) * size
    customers = query.offset(offset).limit(size).all()

    return CustomerListResponse(
        items=customers,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


def get_customer_by_id(db: Session, customer_id: UUID) -> Optional[Customer]:
    """Get a single customer by ID. Returns None if not found."""
    return db.query(Customer).filter(Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str) -> Optional[Customer]:
    """Check if a customer with this email already exists."""
    return db.query(Customer).filter(Customer.email == email).first()


def create_customer(
    db: Session,
    customer_data: CustomerCreate,
    created_by: UUID,
) -> Customer:
    """Create a new customer record.
    
    Args:
        db:            Database session
        customer_data: Validated input from the request
        created_by:    UUID of the user creating this customer
    
    Raises:
        ValueError: If a customer with this email already exists
    """
    # Check for duplicate email
    existing = get_customer_by_email(db, customer_data.email)
    if existing:
        raise ValueError(f"A customer with email '{customer_data.email}' already exists")

    # model_dump() converts the Pydantic schema to a plain dict
    # Then we unpack it into Customer(**data) to create the SQLAlchemy object
    customer = Customer(
        **customer_data.model_dump(),
        created_by=created_by,
    )

    db.add(customer)      # Stage the new record
    db.commit()           # Save to database (runs INSERT SQL)
    db.refresh(customer)  # Reload from DB to get auto-generated fields (id, created_at)
    return customer


def update_customer(
    db: Session,
    customer: Customer,
    update_data: CustomerUpdate,
) -> Customer:
    """Update only the fields that were provided (partial update / PATCH).
    
    Uses exclude_unset=True so we only update fields the client actually sent.
    Example: {"status": "inactive"} → only updates status, ignores all other fields.
    """
    # exclude_unset=True → only fields explicitly set in the request body
    update_dict = update_data.model_dump(exclude_unset=True)

    for field, value in update_dict.items():
        setattr(customer, field, value)  # customer.name = "New Name" etc.

    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer: Customer) -> None:
    """Hard delete a customer record from the database."""
    db.delete(customer)
    db.commit()
