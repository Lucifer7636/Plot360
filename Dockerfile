# ======================================================================
# PLOT360 — Multi-Stage Production Full-Stack Dockerfile
# ======================================================================
# Stage 1: Build the React + Vite Frontend Bundle
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY package*.json ./
RUN npm ci --silent

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ======================================================================
# Stage 2: Python 3.11 Production Runtime (Unified Full-Stack)
FROM python:3.11-slim AS production-runtime
WORKDIR /app

# System dependencies for GIS / GDAL / Rasterio
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to latest (fixes urllib3 connection reset/broken pipe bugs)
RUN pip install --no-cache-dir --upgrade pip

# Install PyTorch CPU wheel with generous retries and timeout
RUN pip install --no-cache-dir --retries 10 --timeout 120 --extra-index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"

# Install remaining Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --retries 10 --timeout 120 -r ./backend/requirements.txt

# Copy backend application source code
COPY backend ./backend

# Copy compiled frontend production assets from Stage 1 into /app/dist
COPY --from=frontend-builder /app/frontend/dist ./dist

# Copy canonical Sentinel-2 dataset
COPY PLOT360_Sentinel2_2020_2025 ./PLOT360_Sentinel2_2020_2025

# Create necessary runtime directories
RUN mkdir -p /app/backend/data /app/backend/data/raw /app/backend/data/processed /app/backend/data/predictions /app/backend/data/masks

# Seed database on startup and launch unified uvicorn server
ENV PYTHONPATH=/app/backend
ENV APP_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

WORKDIR /app/backend
CMD ["sh", "-c", "python scripts/seed_demo.py && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
