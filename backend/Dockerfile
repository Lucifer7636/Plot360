FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
ENV APP_ENV=production

EXPOSE 8000
CMD ["sh", "-c", "python scripts/seed_demo.py && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
