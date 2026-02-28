/**
 * WebSocket relay service.
 *
 * – Connects to RabbitMQ and creates its OWN queue (ws.events.queue)
 *   bound to the existing `url.shortener.exchange` with key `click.event`.
 * – On every click event it broadcasts to all connected Socket.IO clients:
 *     • "click_event"   — the raw click event
 *     • "trending_update" — re-computed top-N trending after each click
 * – Aggregates click counts in memory for instant trending.
 */

const http = require("http");
const { Server } = require("socket.io");
const amqplib = require("amqplib");

const PORT = parseInt(process.env.PORT || "8084", 10);
const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://urlshortener:urlshortener@rabbitmq:5672";
const EXCHANGE = "url.shortener.exchange";
const ROUTING_KEY = "click.event";
const WS_QUEUE = "ws.events.queue";

/* ── In-memory trending aggregator ─────────────────────── */
const clickCounts = new Map(); // shortCode → totalClicks

function getTopTrending(limit = 20) {
  return [...clickCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([shortCode, totalClicks], i) => ({
      shortCode,
      totalClicks,
      rank: i + 1,
    }));
}

/* ── HTTP + Socket.IO server ───────────────────────────── */
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/_health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ status: "ok", connections: io.engine.clientsCount }),
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log(`[ws] Client connected: ${socket.id}`);

  // Send current trending snapshot on connect
  socket.emit("trending_update", { trending: getTopTrending() });

  socket.on("disconnect", (reason) => {
    console.log(`[ws] Client disconnected: ${socket.id} (${reason})`);
  });
});

/* ── RabbitMQ consumer ─────────────────────────────────── */
async function connectRabbitMQ() {
  const maxRetries = 30;
  let retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[ws] Connecting to RabbitMQ (attempt ${attempt}/${maxRetries})...`,
      );
      const conn = await amqplib.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();

      await ch.assertExchange(EXCHANGE, "topic", { durable: true });
      // Our own durable queue — does NOT steal messages from analytics-service
      await ch.assertQueue(WS_QUEUE, { durable: true });
      await ch.bindQueue(WS_QUEUE, EXCHANGE, ROUTING_KEY);
      await ch.prefetch(50);

      console.log(`[ws] Consuming from ${WS_QUEUE}`);

      ch.consume(WS_QUEUE, (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          const shortCode = event.shortCode;

          // Update in-memory counter
          clickCounts.set(shortCode, (clickCounts.get(shortCode) || 0) + 1);

          // Broadcast raw event to all clients
          io.emit("click_event", {
            shortCode,
            timestamp: event.timestamp,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            referrer: event.referrer,
            country: event.country || "unknown",
          });

          // Broadcast updated trending
          io.emit("trending_update", { trending: getTopTrending() });

          ch.ack(msg);
        } catch (err) {
          console.error("[ws] Failed to process message:", err);
          ch.nack(msg, false, true);
        }
      });

      conn.on("close", () => {
        console.error("[ws] RabbitMQ connection closed — reconnecting...");
        setTimeout(connectRabbitMQ, 5000);
      });

      return; // success
    } catch (err) {
      console.error(`[ws] RabbitMQ attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelay));
        retryDelay = Math.min(retryDelay * 1.5, 30000);
      }
    }
  }
  console.error("[ws] Exhausted RabbitMQ retries — exiting");
  process.exit(1);
}

/* ── Bootstrap ─────────────────────────────────────────── */
server.listen(PORT, () => {
  console.log(`[ws] Socket.IO server listening on port ${PORT}`);
  connectRabbitMQ();
});
