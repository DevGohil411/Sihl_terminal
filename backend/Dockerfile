FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend and Data directory
COPY backend/ ./backend/
COPY Data/ ./Data/

# Set environment variables
ENV PORT=8000
ENV CSV_PATH=/app/Data/NIFTY\ 50_minute.csv
ENV PYTHONPATH=/app

EXPOSE $PORT

CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port $PORT"]
