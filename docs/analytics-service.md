# Analytics Service

> **Stack:** Python 3.12 + Django 5.0  
> **Port:** 8083  
> **Database:** MongoDB 7  
> **Messaging:** RabbitMQ (consumer)  
> **WSGI Server:** Gunicorn (2 workers)

## Overview

The Analytics Service consumes click events from RabbitMQ and stores them in MongoDB. It provides REST APIs for querying per-URL analytics (total clicks, clicks by country, clicks by date, recent clicks) and platform-wide trending data.

## API Endpoints

### GET /api/v1/urls/{shortCode}/analytics

Get click analytics for a specific short code.

**Response (200):**

```json
{
  "shortCode": "a1B2c3D",
  "totalClicks": 42,
  "clicksByCountry": {
    "US": 20,
    "DE": 12,
    "unknown": 10
  },
  "clicksByDate": {
    "2026-02-27": 15,
    "2026-02-28": 27
  },
  "recentClicks": [
    {
      "timestamp": "2026-02-28T12:00:00",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "country": "unknown"
    }
  ]
}
```

### GET /api/v1/trending?limit=20

Get the most clicked URLs across the platform.

**Response (200):**

```json
{
  "trending": [
    {
      "shortCode": "a1B2c3D",
      "totalClicks": 142,
      "rank": 1,
      "longUrl": "https://example.com/..."
    }
  ]
}
```

The Trending endpoint enriches results by fetching `longUrl` from the URL Service via internal HTTP call.

### GET /health

Service health check. Returns `200 OK`.

## Architecture Details

- **RabbitMQ Consumer:** `consumer.py` runs in a separate thread (started via Django `AppConfig.ready()`), consuming from `analytics.click.queue` bound to `url.shortener.exchange` with routing key `click.event`
- **MongoDB Storage:** Click events stored in `click_events` collection with fields: `short_code`, `timestamp`, `ip`, `user_agent`, `referrer`, `country`
- **Aggregation Pipelines:** Analytics and trending queries use MongoDB aggregation framework (`$match`, `$group`, `$sort`, `$limit`)

## Configuration

| Environment Variable | Default | Description                         |
| -------------------- | ------- | ----------------------------------- |
| `MONGODB_URI`        | —       | MongoDB connection string with auth |
| `RABBITMQ_URL`       | —       | AMQP connection URL                 |
| `DJANGO_SECRET_KEY`  | —       | Django secret key                   |
| `DJANGO_DEBUG`       | false   | Debug mode                          |
| `PORT`               | 8083    | HTTP listen port                    |

## Running Locally

```bash
cd analytics-service
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8083
```

## Testing

```bash
cd analytics-service
python manage.py test analytics
```

Tests use Django's test framework with mocked MongoDB operations.
