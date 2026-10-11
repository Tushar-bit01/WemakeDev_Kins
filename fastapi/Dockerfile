# --- Stage 1: The Builder ---
FROM python:3.11-slim AS builder

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /kins_solarImage

# Copy only the dependency files first for better caching
COPY pyproject.toml uv.lock* ./

# Install dependencies into a local .venv (Excluding dev tools)
RUN uv sync --frozen --no-dev --no-install-project

# --- Stage 2: The Final Lean Runtime ---
FROM python:3.11-slim
WORKDIR /kins_solarImage

# Install ONLY the base library needed for OpenCV Headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Copy the environment and app code from the builder
COPY --from=builder /kins_solarImage/.venv /kins_solarImage/.venv
COPY . .

# Set the PATH to use the virtualenv automatically
ENV PATH="/kins_solarImage/.venv/bin:$PATH"
# Ensure logs are sent to the terminal immediately
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Call uvicorn directly since we stripped the fastapi CLI baggage
# --workers 1 is critical for a 4GB RAM machine to avoid OOM crashes
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--reload"]