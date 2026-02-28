# ── Runtime ───────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8083

# Run with gunicorn (2 workers for local dev)
CMD ["gunicorn", "analytics_project.wsgi:application", \
     "--bind", "0.0.0.0:8083", \
     "--workers", "2", \
     "--timeout", "120"]
