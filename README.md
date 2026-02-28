# URL Shortener – Microservices System

A scalable URL shortener built with a **polyglot microservices** architecture. Designed as an educational project to study system design concepts commonly asked in interviews.

## Architecture

```
                      ┌──────────────┐
                      │  API Gateway │  (Nginx – port 8080)
                      └──────┬───────┘
               ┌─────────────┼──────────────┐
               ▼             ▼              ▼
        ┌─────────────┐ ┌──────────┐ ┌────────────────┐
        │ URL Service  │ │ Redirect │ │   Analytics    │
        │ Java/Spring  │ │ Service  │ │    Service     │
        │ Boot         │ │ TS/NestJS│ │ Python/Django  │
        │ :8081        │ │ :8082    │ │ :8083          │
        └──────┬───────┘ └────┬─────┘ └───────┬────────┘
               │              │               │
               ▼              ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐
        │PostgreSQL│   │  Redis   │    │ MongoDB  │
        │  :5432   │   │  :6379   │    │  :27017  │
        └──────────┘   └──────────┘    └──────────┘
                              │
                        ┌─────────────┐
                        │  RabbitMQ   │
                        │  :5672      │
                        │  UI :15672  │
                        └─────────────┘
```

## Services

| Service               | Stack                   | Port | Database                              | Responsibility                                       |
| --------------------- | ----------------------- | ---- | ------------------------------------- | ---------------------------------------------------- |
| **URL Service**       | Java 17 + Spring Boot 3 | 8081 | PostgreSQL                            | Create short URLs, validate input, Base62 encoding   |
| **Redirect Service**  | TypeScript + NestJS     | 8082 | Redis (cache) + PostgreSQL (fallback) | Handle redirects, check cache, publish click events  |
| **Analytics Service** | Python 3.12 + Django 5  | 8083 | MongoDB                               | Consume click events from queue, serve analytics API |
| **API Gateway**       | Nginx                   | 8080 | —                                     | Reverse proxy, rate limiting, routing                |

## Infrastructure

| Component     | Port         | Purpose                              |
| ------------- | ------------ | ------------------------------------ |
| PostgreSQL 16 | 5432         | Relational store for URL records     |
| MongoDB 7     | 27017        | Document store for click analytics   |
| Redis 7       | 6379         | Cache layer for fast redirects       |
| RabbitMQ 3    | 5672 / 15672 | Message queue for async click events |

## Quick Start (Docker Compose)

### Prerequisites

- Docker & Docker Compose installed

### Run everything

```bash
docker-compose up --build
```

This starts all infrastructure + all 3 services + the API gateway.

### Test the API

**Create a short URL:**

```bash
curl -X POST http://localhost:8080/api/v1/urls \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://www.google.com/search?q=system+design"}'
```

**Redirect (use the short code from the response):**

```bash
curl -v http://localhost:8080/abc123
```

**Get analytics:**

```bash
curl http://localhost:8080/api/v1/urls/abc123/analytics
```

### Useful URLs

- **API Gateway:** http://localhost:8080
- **RabbitMQ Management:** http://localhost:15672 (urlshortener / urlshortener)
- **Spring Actuator:** http://localhost:8081/actuator/health

## Kubernetes (Local with Minikube)

### Prerequisites

- Minikube + kubectl installed
- Nginx Ingress controller enabled

### Deploy

```bash
# Start minikube
minikube start

# Enable ingress
minikube addons enable ingress

# Build images inside minikube's Docker daemon
eval $(minikube docker-env)   # Linux/Mac
# For PowerShell: minikube docker-env | Invoke-Expression

docker build -t url-service:latest ./url-service
docker build -t redirect-service:latest ./redirect-service
docker build -t analytics-service:latest ./analytics-service

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/init-db-configmap.yaml
kubectl apply -f k8s/infrastructure.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get all -n url-shortener
```

## API Reference

### POST /api/v1/urls

Create a short URL.

**Request:**

```json
{
  "longUrl": "https://example.com/very/long/path",
  "customAlias": "mylink", // optional
  "expiryDate": "2026-12-31T23:59:59" // optional
}
```

**Response (201):**

```json
{
  "shortUrl": "http://localhost:8080/abc123",
  "shortCode": "abc123",
  "longUrl": "https://example.com/very/long/path",
  "expiryDate": null,
  "createdAt": "2026-02-28T12:00:00"
}
```

**Error codes:** 400 (invalid URL), 409 (alias conflict)

### GET /{shortCode}

Redirect to the original URL.

**Status codes:** 301 (redirect), 404 (not found), 410 (expired)

### GET /api/v1/urls/{shortCode}/analytics

Get click analytics for a short code.

**Response (200):**

```json
{
  "shortCode": "abc123",
  "totalClicks": 42,
  "clicksByCountry": { "unknown": 42 },
  "clicksByDate": { "2026-02-28": 42 },
  "recentClicks": [...]
}
```

## Key Concepts Covered

This project demonstrates the following system design concepts:

- **Microservices architecture** with polyglot tech stacks
- **Base62 encoding** for short code generation (auto-increment ID → Base62)
- **Cache-aside pattern** (Redis as read-through cache)
- **Async event processing** (RabbitMQ pub/sub for analytics)
- **API Gateway** pattern (Nginx reverse proxy + rate limiting)
- **Database per service** pattern (PostgreSQL for writes, MongoDB for analytics)
- **Health checks** and readiness probes
- **Container orchestration** (Docker Compose + Kubernetes)
- **Horizontal scaling** (multiple replicas for read-heavy redirect service)
- **TTL-based expiry** with background cleanup jobs
- **Circuit breaker** mindset (graceful fallbacks when Redis/RabbitMQ are down)

## Project Structure

```
url-shortener/
├── docker-compose.yml          # Local development orchestration
├── init-db.sql                 # PostgreSQL schema init
├── api-gateway/
│   └── nginx.conf              # Reverse proxy config
├── url-service/                # Java + Spring Boot
│   ├── Dockerfile
│   ├── build.gradle
│   └── src/main/java/com/urlshortener/urlservice/
│       ├── UrlServiceApplication.java
│       ├── config/             # Redis, RabbitMQ config
│       ├── controller/         # REST endpoints
│       ├── dto/                # Request/Response DTOs
│       ├── entity/             # JPA entities
│       ├── exception/          # Error handling
│       ├── repository/         # Spring Data JPA
│       └── service/            # Business logic + Base62
├── redirect-service/           # TypeScript + NestJS
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── redirect/           # Controller + Service
│       ├── redis/              # Redis client
│       ├── database/           # PostgreSQL client
│       ├── rabbitmq/           # Message publisher
│       └── health/             # Health check
├── analytics-service/          # Python + Django
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── analytics_project/      # Django project settings
│   └── analytics/              # Django app
│       ├── consumer.py         # RabbitMQ consumer
│       ├── mongo.py            # MongoDB client
│       ├── views.py            # Analytics API views
│       └── urls.py             # URL routing
└── k8s/                        # Kubernetes manifests
    ├── namespace.yaml
    ├── config.yaml
    ├── infrastructure.yaml
    ├── services.yaml
    └── ingress.yaml
```
