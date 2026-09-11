# Import all models here so Alembic can discover them during migrations.
# When Alembic looks for changes, it imports this file — which pulls in all models
# so it knows what tables need to exist.
from app.models.user import User
from app.models.customer import Customer

__all__ = ["User", "Customer"]
