# URL Shortener – Microservices System

A scalable URL shortener built with a **polyglot microservices** architecture. Designed as an educational project to study system design concepts commonly asked in interviews.

## Architecture

```
                        ┌──────────────┐
                        │  API Gateway │  (Nginx – port 8080)
                        └──────┬───────┘
          ┌──────────┬────────────┼──────────────┬────────────┐
          ▼          ▼            ▼              ▼            ▼
   ┌───────────┐ ┌────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────┐
   │URL Service│ │Redirect│ │  Analytics  │ │    WS    │ │  Client  │
   │Java/Spring│ │Service │ │   Service   │ │ Service  │ │ Next.js  │
   │  Boot     │ │TS/Nest │ │Python/Django│ │ Node.js  │ │  React   │
   │  :8081    │ │ :8082  │ │   :8083     │ │ :8084    │ │  :3000   │
   └─────┬─────┘ └───┬────┘ └─────┬───────┘ └────┬─────┘ └──────────┘
         │           │            │              │
         ▼           ▼            ▼              │
   ┌──────────┐ ┌──────────┐ ┌──────────┐        │
   │PostgreSQL│ │  Redis   │ │ MongoDB  │        │
   │  :5432   │ │  :6379   │ │  :27017  │        │
   └──────────┘ └──────────┘ └──────────┘        │
                      │                          │
                ┌─────────────┐                  │
                │  RabbitMQ   │◄─────────────────┘
                │  :5672      │  (consumes click events)
                │  UI :15672  │
                └─────────────┘
```

## Services

| Service               | Stack                   | Port | Database                              | Responsibility                                               |
| --------------------- | ----------------------- | ---- | ------------------------------------- | ------------------------------------------------------------ |
| **URL Service**       | Java 17 + Spring Boot 3 | 8081 | PostgreSQL                            | Create short URLs, validate input, random short code gen     |
| **Redirect Service**  | TypeScript + NestJS     | 8082 | Redis (cache) + PostgreSQL (fallback) | Handle redirects, check cache, publish click events          |
| **Analytics Service** | Python 3.12 + Django 5  | 8083 | MongoDB                               | Consume click events from queue, serve analytics & trending  |
| **WS Service**        | Node.js + Socket.IO     | 8084 | — (in-memory)                         | Real-time WebSocket relay, broadcast click & trending events |
| **API Gateway**       | Nginx                   | 8080 | —                                     | Reverse proxy, rate limiting, routing, WebSocket upgrade     |
| **Client**            | Next.js 14 + React 18   | 3000 | —                                     | Web UI with dark/light theme, live analytics dashboard       |

## Infrastructure

| Component     | Port         | Purpose                                         |
| ------------- | ------------ | ----------------------------------------------- |
| PostgreSQL 16 | 5432         | Relational store for URL records                |
| MongoDB 7     | 27017        | Document store for click analytics              |
| Redis 7       | 6379         | Cache layer for fast redirects                  |
| RabbitMQ 3    | 5672 / 15672 | Message queue for async click events & WS relay |

## Quick Start (Docker Compose)

### Prerequisites

- Docker & Docker Compose installed

### Run everything

```bash
docker-compose up --build
```

This starts all infrastructure + all 5 services (URL, Redirect, Analytics, WS, Client) + the API gateway.

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

- **Client UI:** http://localhost:3000
- **API Gateway:** http://localhost:8080
- **WebSocket (Socket.IO):** http://localhost:8080/socket.io/
- **RabbitMQ Management:** http://localhost:15672 (urlshortener / urlshortener)
- **Spring Actuator:** http://localhost:8081/actuator/health

### Run Benchmarks

```bash
cd benchmarks
npm install
npm run bench          # Run all benchmarks
npm run bench:url      # URL creation only
npm run bench:redirect # Redirect service only
npm run bench:analytics # Analytics + Trending
npm run bench:ws       # WebSocket event delivery
npm run bench:gateway  # End-to-end via Nginx
```

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
- **Secure random short codes** (7-char alphanumeric via SecureRandom)
- **Cache-aside pattern** (Redis as read-through cache)
- **Async event processing** (RabbitMQ pub/sub for analytics)
- **API Gateway** pattern (Nginx reverse proxy + rate limiting)
- **Database per service** pattern (PostgreSQL for writes, MongoDB for analytics)
- **Health checks** and readiness probes
- **Container orchestration** (Docker Compose + Kubernetes)
- **Horizontal scaling** (multiple replicas for read-heavy redirect service)
- **TTL-based expiry** with background cleanup jobs
- **Circuit breaker** mindset (graceful fallbacks when Redis/RabbitMQ are down)
- **Real-time WebSocket** relay (Socket.IO via RabbitMQ consumer)
- **Dark/Light theme** support with CSS variable-driven design tokens
- **CI/CD pipeline** with GitHub Actions for automated testing

## Project Structure

```
url-shortener/
├── docker-compose.yml          # Local development orchestration
├── init-db.sql                 # PostgreSQL schema init
├── api-gateway/
│   └── nginx.conf              # Reverse proxy + WebSocket upgrade
├── url-service/                # Java 17 + Spring Boot 3
│   ├── Dockerfile
│   ├── build.gradle
│   └── src/
│       ├── main/java/.../      # Controllers, services, entities, DTOs
│       └── test/java/.../      # Unit & integration tests
├── redirect-service/           # TypeScript + NestJS 10
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── redirect/           # Controller + Service
│       ├── redis/              # Redis client
│       ├── database/           # PostgreSQL client
│       ├── rabbitmq/           # Message publisher
│       └── __tests__/          # Unit tests
├── analytics-service/          # Python 3.12 + Django 5
│   ├── Dockerfile
│   ├── requirements.txt
│   └── analytics/
│       ├── views.py            # Analytics & Trending API views
│       ├── consumer.py         # RabbitMQ consumer
│       └── tests.py            # Unit tests
├── ws-service/                 # Node.js + Socket.IO
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # HTTP + Socket.IO + RabbitMQ consumer
│       └── __tests__/          # Unit tests
├── client/                     # Next.js 14 + React 18 + Tailwind
│   ├── Dockerfile
│   └── src/
│       ├── app/                # Pages (shorten, analytics, trending, docs, status)
│       ├── components/         # Navbar, Footer, BackgroundOrbs, ThemeProvider
│       └── lib/                # API client, WebSocket hook
├── benchmarks/                 # Performance benchmark suite (Node.js)
│   ├── run-all.js              # Combined runner
│   ├── bench-url-service.js
│   ├── bench-redirect-service.js
│   ├── bench-analytics-service.js
│   ├── bench-ws-service.js
│   └── bench-gateway.js
├── docs/                       # Service documentation
│   ├── url-service.md
│   ├── redirect-service.md
│   ├── analytics-service.md
│   ├── ws-service.md
│   └── client.md
├── .github/workflows/          # CI pipeline
│   └── ci.yml                  # Test on push to main
└── k8s/                        # Kubernetes manifests
    ├── namespace.yaml
    ├── config.yaml
    ├── infrastructure.yaml
    ├── services.yaml
    └── ingress.yaml
```
