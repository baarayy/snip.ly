# WebSocket Service (WS Service)

> **Stack:** Node.js 20 + Socket.IO 4  
> **Port:** 8084  
> **Messaging:** RabbitMQ (consumer)

## Overview

The WS Service provides real-time WebSocket event relay. It consumes click events from RabbitMQ and broadcasts them to all connected Socket.IO clients. This enables the client UI to show live updates on the Analytics and Trending pages without polling.

## WebSocket Events

### Emitted to Clients

| Event             | Payload                                             | Description                                       |
| ----------------- | --------------------------------------------------- | ------------------------------------------------- |
| `click_event`     | `{ shortCode, timestamp, ip, userAgent, referrer }` | Raw click event, emitted on every redirect        |
| `trending_update` | `[{ shortCode, totalClicks, rank }, ...]`           | Re-computed top-20 trending list after each click |

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8080", {
  transports: ["websocket"],
});

socket.on("click_event", (data) => {
  console.log("New click:", data);
});

socket.on("trending_update", (data) => {
  console.log("Trending updated:", data);
});
```

The client connects through the API Gateway (Nginx) which proxies `/socket.io/` to the WS Service.

## HTTP Endpoints

### GET /health

Returns `200 OK` with connected client count.

```json
{
  "status": "ok",
  "connections": 5
}
```

## Architecture Details

- **RabbitMQ Consumer:** Connects to exchange `url.shortener.exchange`, creates its own durable queue `ws.events.queue` with routing key `click.event`
- **In-Memory Aggregator:** Maintains a `Map<shortCode, clickCount>` for instant trending computation without database queries
- **Retry Logic:** Up to 30 connection attempts to RabbitMQ with exponential backoff (1s base, 30s max)
- **Stateless Design:** No persistent state — the in-memory trending map rebuilds naturally as events arrive

## Configuration

| Environment Variable | Default                                          | Description                |
| -------------------- | ------------------------------------------------ | -------------------------- |
| `RABBITMQ_URL`       | `amqp://urlshortener:urlshortener@rabbitmq:5672` | AMQP connection URL        |
| `PORT`               | 8084                                             | HTTP/WebSocket listen port |

## Running Locally

```bash
cd ws-service
npm install
npm start
```

## Testing

```bash
cd ws-service
npm test
```

Tests use Jest with mocked RabbitMQ and Socket.IO.
