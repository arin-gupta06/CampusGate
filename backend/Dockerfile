# ==============================================================================
# CampusGate - Production Backend Dockerfile
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal OS dependencies for network health checks and OpenCV runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libglib2.0-0 \
    libgl1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
# Install CPU-only PyTorch and Torchvision
RUN pip install --no-cache-dir \
    --timeout 120 \
    --retries 10 \
    --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision

# Install production application dependencies
COPY requirements.prod.txt .
RUN pip install --no-cache-dir \
    --timeout 120 \
    --retries 10 \
    -r requirements.prod.txt

# Copy backend application source code and model weights
COPY backend/ /app/backend/
COPY ml_training/ /app/ml_training/

# Create directory for runtime vehicle crop snapshots and assign non-root system user
RUN mkdir -p /app/backend/static \
    && useradd -u 10001 -m -s /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Health check to ensure FastAPI is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

