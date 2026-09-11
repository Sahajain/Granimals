# backend/Dockerfile — Builds the FastAPI app container
#
# Multi-stage builds are optional here; for a simple app we use one stage.
#
# Layer caching:
#   Docker caches each layer. If requirements.txt hasn't changed, it
#   skips the pip install step (saves ~60 seconds on rebuilds).
#   That's why we COPY requirements.txt BEFORE copying the app code.

FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies needed by psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements FIRST (enables Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port FastAPI listens on
EXPOSE 4002

# Default command (can be overridden in docker-compose.yml)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4002"]
