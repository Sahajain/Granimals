import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    name = Column(String(255), nullable=False)

    email = Column(
        String(255),
        unique=True,    # No two customers with the same email
        nullable=False,
        index=True,     # We'll search by email a lot, index makes it fast
    )

    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True, index=True)  # Filter by company often
    notes = Column(Text, nullable=True)   # Free-form notes about the customer

    # 'active' | 'inactive'
    status = Column(
        String(50),
        default="active",
        nullable=False,
        index=True,     # We'll filter by status a lot
    )

    # ForeignKey = a reference to another table's row
    # This column stores the UUID of the user who created this customer
    # ON DELETE SET NULL → if the user is deleted, don't delete their customers
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # onupdate=datetime.utcnow → automatically updates whenever we save the row
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # The other side of the User.customers relationship
    # Lets us do: customer.created_by_user to get the User object
    created_by_user = relationship("User", back_populates="customers")

    def __repr__(self):
        return f"<Customer id={self.id} name={self.name} status={self.status}>"
