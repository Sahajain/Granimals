"""
main.py — The entry point of our FastAPI application.

When you run: uvicorn app.main:app --reload
Python starts this file, creates the FastAPI app, and listens for requests.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, customers

# ── Create the FastAPI App ────────────────────────────────────────────
app = FastAPI(
    title="Customer Management System",
    description="A REST API for managing customers — Full Stack Technical Assessment",
    version="1.0.0",
    # Swagger UI lives at /docs — great for testing your API without Postman!
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ───────────────────────────────────────────────────
# Allows our React frontend to call this API regardless of the exact port Vite picks
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4010",
        "http://localhost:4011",
        "http://localhost:4012",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register Routers ──────────────────────────────────────────────────
# Include all our routers — this mounts all their endpoints onto the app
app.include_router(auth.router)        # /api/auth/...
app.include_router(customers.router)   # /api/customers/...


# ── Root & Health Check ───────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Customer Management API is running! 🚀",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
