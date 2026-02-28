/**
 * Benchmark: WebSocket Service – Socket.IO event throughput
 *
 * Connects multiple Socket.IO clients, triggers clicks, and measures
 * how quickly events are broadcast to all connected clients.
 */
const { request, sleep } = require("./utils");

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   WebSocket Service Benchmark – Socket.IO Events  ║");
  console.log("╚══════════════════════════════════════════════════╝");

  // Dynamic import socket.io-client
  let io;
  try {
    io = require("socket.io-client");
  } catch {
    console.log("\n  ⚠ socket.io-client not installed. Run: npm install");
    console.log("  Skipping WebSocket benchmark.\n");
    return { listeners: 0, results: [] };
  }

  const WS_URL = process.env.WS_URL || "http://localhost:8080";

  // Create test URLs for clicking
  console.log("\n  Creating test URLs...");
  const testCodes = [];
  for (let i = 0; i < 3; i++) {
    try {
      const res = await request("POST", "/api/v1/urls", {
        longUrl: `https://example.com/ws-bench-${i}?t=${Date.now()}`,
      });
      if (res.body?.shortCode) testCodes.push(res.body.shortCode);
    } catch {}
  }

  if (testCodes.length === 0) {
    console.log("  ✗ Could not create test URLs");
    return { listeners: 0, results: [] };
  }
  console.log(`  Created: ${testCodes.join(", ")}`);

  // Connect N Socket.IO clients
  const CLIENT_COUNTS = [1, 5, 10, 25];
  const allResults = [];

  for (const numClients of CLIENT_COUNTS) {
    console.log(`\n  Phase: ${numClients} connected clients`);

    const clients = [];
    const eventCounts = new Map();
    const latencies = [];

    // Connect clients
    for (let c = 0; c < numClients; c++) {
      const socket = io(WS_URL, {
        transports: ["websocket"],
        reconnection: false,
        timeout: 5000,
      });

      socket.on("click_event", (data) => {
        const now = Date.now();
        eventCounts.set(c, (eventCounts.get(c) || 0) + 1);
        if (data._benchTs) {
          latencies.push(now - data._benchTs);
        }
      });

      clients.push(socket);
    }

    // Wait for connections
    await sleep(1500);

    const connected = clients.filter((s) => s.connected).length;
    console.log(`  Connected: ${connected}/${numClients}`);

    if (connected === 0) {
      console.log("  ⚠ No clients connected — skipping phase");
      clients.forEach((s) => s.disconnect());
      continue;
    }

    // Trigger clicks to generate events
    const NUM_CLICKS = 20;
    const clickStart = Date.now();

    for (let i = 0; i < NUM_CLICKS; i++) {
      request("GET", `/${testCodes[i % testCodes.length]}`).catch(() => {});
    }

    // Wait for events to propagate
    await sleep(4000);

    const totalEvents = [...eventCounts.values()].reduce((a, b) => a + b, 0);
    const expectedEvents = connected * NUM_CLICKS;
    const deliveryRate =
      expectedEvents > 0
        ? ((totalEvents / expectedEvents) * 100).toFixed(1)
        : "0";
    const eventsPerSec =
      totalEvents > 0
        ? (totalEvents / ((Date.now() - clickStart) / 1000)).toFixed(1)
        : "0";

    console.log(
      `  ✓ Events: ${totalEvents}/${expectedEvents} delivered ` +
        `(${deliveryRate}%) | ${eventsPerSec} events/s`,
    );

    allResults.push({
      clients: numClients,
      connected,
      clicks: NUM_CLICKS,
      totalEvents,
      expectedEvents,
      deliveryRate: parseFloat(deliveryRate),
      eventsPerSec: parseFloat(eventsPerSec),
    });

    // Disconnect
    clients.forEach((s) => s.disconnect());
    await sleep(500);
  }

  // Summary
  console.log(`\n${"═".repeat(70)}`);
  console.log("  WEBSOCKET SERVICE BENCHMARK RESULTS");
  console.log(`${"═".repeat(70)}`);
  console.log(
    "  " +
      "Clients".padEnd(10) +
      "Connected".padEnd(12) +
      "Clicks".padEnd(10) +
      "Events".padEnd(12) +
      "Delivery%".padEnd(12) +
      "Evt/s".padEnd(10),
  );
  console.log("  " + "─".repeat(64));
  for (const r of allResults) {
    console.log(
      "  " +
        String(r.clients).padEnd(10) +
        String(r.connected).padEnd(12) +
        String(r.clicks).padEnd(10) +
        `${r.totalEvents}/${r.expectedEvents}`.padEnd(12) +
        `${r.deliveryRate}%`.padEnd(12) +
        `${r.eventsPerSec}`.padEnd(10),
    );
  }
  console.log(`${"═".repeat(70)}\n`);

  return { listeners: CLIENT_COUNTS, results: allResults };
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
