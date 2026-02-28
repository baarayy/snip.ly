# URL Service

> **Stack:** Java 17 + Spring Boot 3.2 + Gradle  
> **Port:** 8081  
> **Database:** PostgreSQL 16  
> **Messaging:** RabbitMQ (producer)  
> **Cache:** Redis 7

## Overview

The URL Service is the core write-path service. It creates shortened URLs, generates short codes, persists them to PostgreSQL, and caches them in Redis for fast lookups by the Redirect Service.

## API Endpoints

### POST /api/v1/urls

Create a new short URL.

**Request:**

```json
{
  "longUrl": "https://example.com/very/long/url",
  "customAlias": "mylink", // optional, 3-10 alphanumeric chars
  "expiryDate": "2026-12-31T23:59:59" // optional
}
```

**Response (201 Created):**

```json
{
  "shortUrl": "http://localhost:8080/a1B2c3D",
  "shortCode": "a1B2c3D",
  "longUrl": "https://example.com/very/long/url",
  "expiryDate": null,
  "createdAt": "2026-02-28T12:00:00"
}
```

**Error Codes:**
| Status | Reason |
|--------|--------|
| 400 | Invalid URL format or validation failure |
| 409 | Custom alias already in use |

### GET /api/v1/urls/{shortCode}

Get URL metadata (admin/debug endpoint, not a redirect).

**Response (200):** Same as creation response.

### GET /api/v1/urls/health

Service health check. Returns `200 OK` with plain text.

## Short Code Generation

Short codes are generated using `SecureRandom` with a 62-character alphabet (`a-z`, `A-Z`, `0-9`) producing 7-character codes. This gives ~3.5 trillion unique codes. On collision (unique constraint violation), the service retries up to 10 times.

## Architecture Details

- **JPA Entity:** `Url` mapped to `urls` table with columns: `id`, `short_code` (unique), `long_url`, `created_at`, `expiry_at`, `user_id`, `is_active`
- **Redis Caching:** On creation, the mapping `url:<shortCode> → longUrl` is cached in Redis with optional TTL matching the expiry date
- **Expiry Cleanup:** `ExpiryCleanupService` runs a scheduled job (`@Scheduled`) to deactivate expired URLs

## Configuration

| Environment Variable         | Default   | Description         |
| ---------------------------- | --------- | ------------------- |
| `SPRING_DATASOURCE_URL`      | —         | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | —         | DB username         |
| `SPRING_DATASOURCE_PASSWORD` | —         | DB password         |
| `SPRING_RABBITMQ_HOST`       | localhost | RabbitMQ host       |
| `SPRING_RABBITMQ_PORT`       | 5672      | RabbitMQ port       |
| `SPRING_REDIS_HOST`          | localhost | Redis host          |
| `SPRING_REDIS_PORT`          | 6379      | Redis port          |

## Running Locally

```bash
cd url-service
./gradlew bootRun
```

## Testing

```bash
cd url-service
./gradlew test
```

Tests use Spring Boot Test with mocked repositories and Redis.
