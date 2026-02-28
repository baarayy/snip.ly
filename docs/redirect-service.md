# Redirect Service

> **Stack:** TypeScript + NestJS 10  
> **Port:** 8082  
> **Cache:** Redis 7 (primary lookup)  
> **Database:** PostgreSQL 16 (fallback)  
> **Messaging:** RabbitMQ (producer – publishes click events)

## Overview

The Redirect Service handles the read-heavy path — resolving short codes to their original URLs and issuing HTTP redirects. It implements a **cache-aside** pattern: check Redis first, fall back to PostgreSQL, and re-populate the cache on miss. Every successful redirect publishes a click event to RabbitMQ for async analytics processing.

## API Endpoints

### GET /{shortCode}

Resolve a short code and redirect to the original URL.

**Flow:**

1. Look up `url:<shortCode>` in Redis
2. On cache miss → query PostgreSQL `urls` table
3. Check expiry → if expired, return `410 Gone`
4. Cache the result in Redis (if it was a miss)
5. Publish click event to RabbitMQ (fire-and-forget)
6. Return `301 Moved Permanently` with `Location` header

**Status Codes:**
| Status | Meaning |
|--------|---------|
| 301 | Redirect – `Location` header contains the original URL |
| 404 | Short code not found in cache or database |
| 410 | URL has expired |

**Click Event Payload (published to RabbitMQ):**

```json
{
  "shortCode": "a1B2c3D",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://example.com"
}
```

### GET /health

Service health check. Returns `200 OK`.

## Architecture Details

- **RedisService:** Wraps `ioredis` client for get/set operations on `url:*` keys
- **DatabaseService:** Raw `pg` client querying the `urls` table for cache miss fallback
- **RabbitMQService:** Publishes to exchange `url.shortener.exchange` with routing key `click.event`
- **Graceful degradation:** If Redis is down, falls back directly to PostgreSQL. If RabbitMQ is down, the redirect still works (click event is silently dropped)

## Configuration

| Environment Variable | Default   | Description                  |
| -------------------- | --------- | ---------------------------- |
| `DATABASE_URL`       | —         | PostgreSQL connection string |
| `REDIS_HOST`         | localhost | Redis host                   |
| `REDIS_PORT`         | 6379      | Redis port                   |
| `RABBITMQ_URL`       | —         | AMQP connection URL          |
| `PORT`               | 8082      | HTTP listen port             |

## Running Locally

```bash
cd redirect-service
npm install
npm run start:dev
```

## Testing

```bash
cd redirect-service
npm test
```

Tests use Jest with mocked Redis, Database, and RabbitMQ services.
