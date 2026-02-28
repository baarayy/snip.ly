# Architecture Decisions & Justifications — snip.ly

> Every architectural and technology decision in this system was made deliberately. This document captures the reasoning behind each choice, the trade-offs considered, and the problem space this system addresses.

---

## Problem Statement

### The Challenge

Modern organizations and individuals share billions of URLs daily across emails, social media, messaging platforms, and documentation. Raw URLs present several problems:

1. **Length & Readability**: URLs with query parameters, UTM codes, and deep paths can span hundreds of characters — making them unusable in character-limited platforms (Twitter/X, SMS), ugly in printed materials, and prone to line-breaking in emails.

2. **No Tracking**: Sharing a raw URL provides zero visibility into engagement. Teams cannot answer fundamental questions: _How many people clicked? From which countries? On which devices? Which campaign performed better?_

3. **No Control After Sharing**: Once a URL is shared, the sender loses all control. Links cannot be expired, redirected to updated destinations, or disabled if they become compromised.

4. **Scalability of Existing Solutions**: Most open-source URL shorteners are monolithic applications that cannot scale individual components independently. When redirect traffic spikes, the entire application must scale — including the rarely-used analytics and URL creation endpoints.

### What This System Solves

snip.ly is a **production-grade, polyglot microservices URL shortener** that demonstrates how to solve these problems with modern distributed systems patterns:

- **Decoupled shortening, redirecting, and analytics** — each service scales independently based on its own traffic profile
- **Sub-10ms redirects** through Redis caching with PostgreSQL as source of truth
- **Real-time click analytics** streamed via RabbitMQ and stored in MongoDB for flexible aggregation
- **Event-driven architecture** that decouples the fast path (redirect) from the slow path (analytics processing)
- **Live updates** via WebSocket for instant visibility into link engagement

This is not just a URL shortener — it's a **teaching platform** for polyglot microservices architecture, demonstrating how 4 different languages and 4 different databases collaborate through well-defined APIs and message-based communication.

---

## System Components & Justifications

### 1. URL Service — Java 17 + Spring Boot 3.2

**What it does**: Creates shortened URLs, stores mappings in PostgreSQL, publishes creation events to RabbitMQ.

**Why Java/Spring Boot**:

- **Enterprise readiness**: Spring Boot is the most battle-tested framework for building production microservices. Its ecosystem (Spring Data JPA, Spring AMQP, Spring Cache) provides mature solutions for every concern.
- **Strong typing & compile-time safety**: For the most critical service (URL creation and storage), Java's type system catches errors before deployment. A bug here means data loss.
- **JPA/Hibernate**: Complex URL entity management (custom aliases, expiry dates, collision detection) benefits from JPA's ORM capabilities.
- **Connection pooling**: HikariCP provides industry-best connection pool management for PostgreSQL.
- **Thread-per-request model**: URL creation is I/O-bound (DB writes, RabbitMQ publishes). Virtual threads (Java 21) or Spring's async support handle this efficiently.

**Why NOT Node.js/Python here**: URL creation involves transactional database operations with collision retry logic. Java's mature transaction management (`@Transactional`) and ORM make this significantly safer than hand-rolling SQL in a dynamic language.

**Trade-off accepted**: Slower cold start time (~3-5s) compared to Node.js (~500ms). Acceptable because this service stays running; it's not a serverless function.

---

### 2. Redirect Service — TypeScript + NestJS 10.3

**What it does**: Handles `GET /:shortCode` — the hot path. Looks up the target URL (Redis first, then PostgreSQL fallback) and issues a 302 redirect. Publishes click events to RabbitMQ.

**Why TypeScript/NestJS**:

- **Non-blocking I/O**: The redirect service is purely I/O-bound (cache lookup → DB lookup → message publish → HTTP redirect). Node.js's event loop processes thousands of concurrent redirects on a single thread without the overhead of thread-per-request.
- **TypeScript**: Type safety for the most performance-critical path. A runtime error here means broken redirects for all users.
- **NestJS**: Provides dependency injection, module system, and decorator-based routing — bringing structure to Node.js without sacrificing performance.
- **Redis integration**: `ioredis` is a first-class Redis client in the Node ecosystem with pipelining, Lua scripting, and cluster support.

**Why NOT Java here**: While Java could handle this, Node.js's event loop has lower per-request overhead for this specific pattern (cache-hit → redirect). At scale, this means fewer servers for the same throughput.

**Cache-aside pattern**:

1. Check Redis → if hit, redirect immediately (~1-2ms)
2. If miss, query PostgreSQL → cache in Redis → redirect (~10-15ms)
3. Publish click event to RabbitMQ (fire-and-forget, non-blocking)

**Trade-off accepted**: Single-threaded — CPU-bound work (not present here) would be a bottleneck. Since redirect is pure I/O, this isn't a concern.

---

### 3. Analytics Service — Python 3.12 + Django 5.0

**What it does**: Consumes click events from RabbitMQ, stores them in MongoDB, and serves aggregated analytics via REST API (individual URL stats + paginated trending).

**Why Python/Django**:

- **Data processing strength**: Python is the natural choice for data aggregation, transformation, and analytics workloads. Libraries like `pymongo` provide idiomatic MongoDB access.
- **MongoDB aggregation pipelines**: Django's flexibility (not using Django ORM for Mongo) lets us write expressive `$group`, `$sort`, `$skip`, `$limit` pipelines directly.
- **Rapid development**: Django's built-in URL routing, middleware, and view system means less boilerplate for a CRUD/read-heavy API.
- **RabbitMQ consumer**: `pika` library provides a straightforward blocking consumer that processes click events sequentially — appropriate for analytics ingestion.

**Why NOT Spring Boot here**: Analytics queries are ad-hoc aggregations over semi-structured data. Python's dynamic typing and dict-friendly syntax make MongoDB pipeline construction far more readable than Java's `Document` builder pattern.

**Why Django over Flask/FastAPI**: Django provides batteries-included structure (management commands for the RabbitMQ consumer, middleware, URL routing patterns) while remaining lightweight when we skip the ORM for MongoDB access.

**Trade-off accepted**: Python is slower than Java/Go for raw computation. Mitigated by MongoDB doing the heavy aggregation server-side; Python just constructs and dispatches the queries.

---

### 4. API Gateway — Nginx

**What it does**: Single entry point for all client requests. Routes traffic to the correct microservice, handles WebSocket upgrades, and provides rate limiting.

**Why Nginx**:

- **Battle-tested reverse proxy**: Handles millions of concurrent connections with minimal resource usage.
- **Rate limiting**: `limit_req_zone` provides token-bucket rate limiting (configured at 50 req/s) without additional application code.
- **WebSocket proxying**: Native `proxy_pass` with `Upgrade` header handling for Socket.IO connections.
- **Path-based routing**: Clean routing rules — `/api/v1/urls` → url-service, `/api/v1/trending` → analytics-service, `/:shortCode` → redirect-service.
- **DNS resolution**: `resolver 127.0.0.11` for Docker's embedded DNS, with service names as upstream variables to avoid stale DNS caching.

**Why NOT Kong/Traefik/Envoy**: For the current scale, Nginx provides everything needed with minimal operational complexity. These alternatives add service discovery, plugin systems, and control planes that introduce unnecessary complexity at this stage.

**Trade-off accepted**: No built-in service discovery or circuit breaking. Acceptable for Docker Compose; Kubernetes Ingress will replace this in Phase 4.

---

### 5. WebSocket Service — Node.js 20 + Socket.IO 4

**What it does**: Consumes click events from RabbitMQ and broadcasts them to connected browser clients in real-time via WebSocket.

**Why a dedicated service**:

- **Separation of concerns**: WebSocket connections are long-lived and stateful. Mixing them into the redirect service (high-throughput, stateless) would couple their scaling characteristics.
- **Fan-out pattern**: One RabbitMQ message → broadcast to N connected clients. This is a distinct workload from request/response services.

**Why Node.js + Socket.IO**:

- **Socket.IO**: Provides transparent fallbacks (WebSocket → long-polling), automatic reconnection, room/namespace support, and heartbeats — all out of the box.
- **Node.js**: Ideal for managing thousands of concurrent persistent connections via the event loop.
- **In-memory trending**: Maintains a lightweight in-memory cache of trending data for instant emission to newly connected clients.

**Trade-off accepted**: In-memory state means trending data is lost on restart (rebuilds quickly from MongoDB). A Redis-backed approach would add persistence but also latency.

---

### 6. Client — Next.js 14 + React 18 + Tailwind CSS 3.4

**What it does**: Single-page application providing URL shortening form, analytics dashboard, trending page with pagination, documentation, and system status.

**Why Next.js**:

- **SSR/SSG capability**: Pages like docs and run-locally can be statically generated for instant loading.
- **App Router**: File-system routing with layouts, loading states, and error boundaries.
- **API routes**: Potential for server-side API calls that bypass CORS.
- **Server rewrites**: `next.config.js` rewrites proxy `/api/` to the gateway, enabling same-origin API calls in production.

**Why Tailwind CSS**:

- **Utility-first**: Rapid UI development with consistent design tokens.
- **CSS variables integration**: Custom properties (`--brand-navy`, `--brand-purple`) power the dark/light theme system.
- **PurgeCSS**: Production CSS is < 15KB.

**Why Framer Motion**:

- Declarative animations that feel natural with React's component model
- `AnimatePresence` for exit animations (page transitions, result reveals)
- `layoutId` for shared layout animations (navbar active tab indicator)
- `whileHover`/`whileTap` for micro-interactions throughout the UI

**Trade-off accepted**: Client-side rendering for most pages means no SEO for dynamic content. Acceptable because URL shortener pages are tools, not content to be indexed.

---

## Database Decisions

### PostgreSQL — URL Mappings (Source of Truth)

**Why**: URL mappings require ACID guarantees. A shortened URL must never map to two different destinations, and custom alias uniqueness must be enforced atomically.

- **UNIQUE constraint** on `short_code` column prevents duplicates at the database level
- **Transactions** ensure that collision-retry logic in the URL service is atomic
- **Relational model** fits the simple but strict URL mapping schema perfectly

**Why NOT MongoDB here**: URL mappings are highly relational (one-to-one mapping), require strict uniqueness, and benefit from SQL's `ON CONFLICT` handling.

### MongoDB — Click Analytics

**Why**: Click events are semi-structured (variable fields: country, referrer, user-agent) and write-heavy. The analytics query pattern is aggregation-based (group by country, group by date, top-N trending).

- **Schema flexibility**: Click events from different sources may have different fields. MongoDB handles this natively.
- **Aggregation framework**: `$group`, `$sort`, `$skip`, `$limit` pipelines run server-side with indexing support.
- **Write performance**: Append-only insert pattern with no complex transactions needed.
- **Pagination support**: `$skip` and `$limit` stages enable efficient cursor-based pagination for trending.

**Why NOT PostgreSQL here**: While PostgreSQL can handle analytics (with good indexing), MongoDB's aggregation framework is more natural for ad-hoc analytics queries, and its document model matches the semi-structured click event data.

### Redis — Redirect Cache

**Why**: The redirect path must be sub-10ms. Redis provides in-memory key-value lookups with ~0.5ms latency.

- **Cache-aside pattern**: Redirect service checks Redis first, falls back to PostgreSQL on miss, then populates cache
- **TTL-based expiry**: Cached mappings expire naturally, ensuring eventual consistency with PostgreSQL
- **Single-purpose**: Used exclusively for redirect caching — simple, fast, predictable

**Why NOT Memcached**: Redis provides persistence options, richer data structures (useful for future features like rate limiting per key), and better tooling.

---

## Communication Patterns

### RabbitMQ — Asynchronous Event Streaming

**Why RabbitMQ over Kafka**:

- **Simplicity**: RabbitMQ's AMQP model with exchanges and queues is simpler to operate than Kafka's broker-partition-consumer-group model.
- **Fan-out exchange**: Click events are published once and delivered to both the analytics consumer and the WebSocket consumer. RabbitMQ's fanout exchange handles this natively.
- **Acknowledgments**: Consumer acknowledgments ensure no click events are lost during analytics processing.
- **Current scale**: At the current event volume (thousands/day), RabbitMQ's throughput is more than sufficient.

**When to switch to Kafka**: When event volume exceeds 100K events/second, when event replay is needed, or when multiple independent consumer groups require at-least-once delivery with offset tracking.

### REST — Synchronous Service-to-Service

**Why REST for URL service ↔ redirect service**:

- **Simplicity**: HTTP GET for URL lookup is the most natural protocol.
- **Caching**: HTTP caching headers can be leveraged for intermediate caches.
- **Debuggability**: `curl` is all you need to test any service endpoint.

**Why NOT gRPC**: The inter-service communication is simple request/response with small payloads. gRPC's protobuf serialization adds complexity without meaningful performance gain at this scale.

---

## Short Code Generation Strategy

### Hash-Based with Collision Retry

**Current approach**: SHA-256 hash of `longUrl + timestamp + random`, then Base62-encode and truncate to 7 characters.

**Why this approach**:

- **Deterministic length**: Always 7 characters — predictable and readable
- **Collision handling**: On conflict, retry with new random seed (expected collision rate < 0.001% for < 1M URLs)
- **Custom aliases**: Users can override with their own alias, subject to uniqueness check
- **No external dependency**: No distributed ID generator (Snowflake, ULID) needed

**Why NOT auto-increment**: Sequential IDs are predictable — users could enumerate all shortened URLs. Hash-based codes are effectively random.

**Why NOT UUID**: UUIDs are 36 characters — defeats the purpose of shortening. Base62-encoded UUIDs are still 22 characters.

---

## Deployment Decision: Docker Compose

**Why Docker Compose for Phase 1**:

- **Single-command startup**: `docker compose up` runs all 10 containers (6 services + 4 data stores)
- **Network isolation**: Services communicate via Docker's internal DNS without port conflicts
- **Development parity**: Every developer runs the exact same stack regardless of OS
- **Simple health checks**: Docker's `healthcheck` directive with `depends_on: condition: service_healthy` ensures correct startup order

**Why NOT Kubernetes yet**: Kubernetes adds significant operational complexity (cluster management, YAML manifests, ingress controllers). Phase 1 focuses on proving the architecture; Phase 4 introduces K8s for production.

---

## Testing Strategy Justification

### 40 Tests Across 4 Services

| Service           | Framework                   | Tests | Focus                                                 |
| ----------------- | --------------------------- | ----- | ----------------------------------------------------- |
| URL Service       | JUnit 5 + Spring Boot Test  | 12    | URL creation, validation, collision handling, expiry  |
| Redirect Service  | Jest + NestJS Testing       | 10    | Cache hit/miss, redirect logic, 404 handling          |
| Analytics Service | Django TestCase + mongomock | 10    | Aggregation pipelines, API responses, health checks   |
| WS Service        | Jest + Socket.IO Client     | 8     | Connection handling, event broadcasting, reconnection |

**Why this distribution**: Test count correlates with business logic complexity. The URL service has the most complex logic (collision detection, custom aliases, expiry validation).

**CI/CD**: GitHub Actions runs all tests on every push. URL service tests run inside Docker (Gradle in `Dockerfile.test`) to ensure JDK compatibility. Other services use native test runners.

---

## Design System Decisions

### Dark-First with Light Mode

**Why dark-first**: URL shortener tools are often used by developers and marketers who prefer dark UIs. The brand aesthetic (navy/purple/pink) is inherently dark-optimized.

**Implementation**: CSS custom properties with `[data-theme]` selectors. Every color, shadow, background, and border references a variable, enabling zero-flash theme switching via `localStorage`.

### Framer Motion Everywhere

**Philosophy**: Every state change should be visually communicated. Loading → loaded, page navigation, hover states, and real-time data updates all use motion primitives for a polished, app-like feel.

**Performance consideration**: Motion components use `will-change: transform` and hardware-accelerated properties only. Heavy animations (background orbs, light rays) use `transform` and `opacity` exclusively.

---

## Summary of Trade-offs

| Decision                | Benefit                              | Trade-off                              |
| ----------------------- | ------------------------------------ | -------------------------------------- |
| Polyglot (4 languages)  | Best tool per job, learning showcase | Higher operational complexity          |
| 3 databases             | Optimal storage per workload         | More infrastructure to manage          |
| RabbitMQ over Kafka     | Simpler operations                   | Lower max throughput ceiling           |
| REST over gRPC          | Simpler debugging, wider tooling     | Slightly higher serialization overhead |
| Docker Compose over K8s | Simple local development             | No production orchestration (yet)      |
| Redis cache-aside       | Sub-10ms redirects                   | Eventual consistency window            |
| Hash-based short codes  | No external dependencies             | Theoretical collision possibility      |
| CSR over SSR            | Simpler data fetching for dashboard  | No SEO for dynamic pages               |

---

_Each decision was made to balance production-readiness with educational value, demonstrating that polyglot microservices can be practical and performant when each component plays to its language's strengths._
