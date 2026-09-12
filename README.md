# Customer Management System

A full-stack web application for managing customers — built as a technical assessment.


---

## Features

- **Authentication** — JWT-based login & registration with bcrypt password hashing
- **Customer CRUD** — Create, Read, Update, Delete customer records
- **Search & Filter** — Live search by name/email/company, filter by status
- **Pagination** — Efficient server-side pagination
- **Role-Based Access** — Admin and User roles (RBAC)
- **Responsive UI** — Light-themed React frontend with modern design system
- **27 Tests** — Full backend test coverage with pytest

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Testing | pytest, httpx, SQLite (in-memory) |
| CI/CD | GitHub Actions |
| Containerization | Docker, Docker Compose |

---

## Project Structure

```
customer-management/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── deps.py              # Dependency injection (auth, DB)
│   │   ├── core/
│   │   │   ├── config.py        # Settings from .env
│   │   │   └── security.py      # JWT + bcrypt
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API endpoint handlers
│   │   └── services/            # Business logic layer
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with interceptors
│   │   ├── context/             # React Context (auth state)
│   │   ├── components/          # Reusable UI components
│   │   └── pages/               # Login, CustomerList, CustomerForm, CustomerDetail
│   ├── Dockerfile
│   └── vite.config.js
├── .github/
│   └── workflows/ci.yml         # GitHub Actions CI
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16

### Option A — Manual Setup (Development)

#### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/customer-management.git
cd customer-management
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env         # Windows
# cp .env.example .env         # Mac/Linux
# Edit .env with your DB credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 4002
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:4002" > .env

# Start dev server
npm run dev
```

#### 4. Access the app
- **Frontend:** http://localhost:4011
- **Backend API:** http://localhost:4002
- **API Docs (Swagger):** http://localhost:4002/docs

---

### Option B — Docker (One Command)

```bash
# Copy and configure environment
cp .env.example .env

# Start everything
docker compose up

# Access:
# Frontend: http://localhost:4011
# Backend:  http://localhost:4002
# Docs:     http://localhost:4002/docs
```

---

## Running Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# Run with coverage report
pytest tests/ -v --cov=app --cov-report=term-missing
```

**Test coverage:**
| File | Tests |
|---|---|
| `tests/test_auth.py` | Register, login, duplicate email, invalid email, /me endpoint |
| `tests/test_customers.py` | Full CRUD, search, filter, pagination, 404 handling |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login, receive JWT token |
| `GET` | `/api/auth/me` | Get current user info |

### Customers (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | List customers (search, filter, paginate) |
| `GET` | `/api/customers/{id}` | Get one customer |
| `POST` | `/api/customers` | Create a customer |
| `PUT` | `/api/customers/{id}` | Update a customer |
| `DELETE` | `/api/customers/{id}` | Delete a customer |

**Query parameters for `GET /api/customers`:**
- `page` — Page number (default: 1)
- `size` — Items per page (default: 10, max: 100)
- `search` — Search by name, email, or company
- `status` — Filter by `active` or `inactive`

---

## Environment Variables

### Backend (`backend/.env`)
```ini
DATABASE_URL=postgresql://cms_user:cms_pass@localhost:5432/cms_db
SECRET_KEY=your-very-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:4002
```

---

## Architecture Decisions

**Why FastAPI?**
FastAPI generates OpenAPI docs automatically, has excellent type safety via Pydantic, and is one of the fastest Python frameworks available.

**Why JWT (stateless auth)?**
JWTs allow horizontal scaling — any server can validate a token without a shared session store. Tokens expire automatically.

**Why UUIDs instead of sequential IDs?**
Sequential IDs are guessable (attackers can enumerate resources). UUIDs are random and work in distributed systems.


**Why SQLite for tests?**
Tests use an in-memory SQLite DB — no PostgreSQL installation needed in CI, each test gets a fresh database, and tests run in parallel without conflicts.

---

