/**
 * Benchmark: API Gateway – end-to-end through Nginx
 *
 * Tests the full request path through Nginx to each backend,
 * measuring gateway overhead and overall system throughput.
 */
const { request, runConcurrent, printSummary, sleep } = require("./utils");

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║   API Gateway Benchmark – End-to-End via Nginx    ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  // 1. Health endpoint (baseline — no backend)
  console.log("\n── Gateway Health (no backend) ──");
  const healthStats = await runConcurrent("GET /_health", 200, () =>
    request("GET", "/_health"),
  );

  // 2. URL creation through gateway
  console.log("\n── URL Creation via Gateway ──");
  let counter = 0;
  const createStats = await runConcurrent(
    "POST /api/v1/urls (c=25)",
    150,
    (i) =>
      request("POST", "/api/v1/urls", {
        longUrl: `https://example.com/gw-bench-${++counter}?t=${Date.now()}`,
      }),
  );

  // Collect a short code for redirect test
  let testCode = null;
  try {
    const res = await request("POST", "/api/v1/urls", {
      longUrl: `https://example.com/gw-redirect-test?t=${Date.now()}`,
    });
    testCode = res.body?.shortCode;
  } catch {}

  // 3. Redirect through gateway
  console.log("\n── Redirect via Gateway ──");
  let redirectStats = { label: "GET /{code} (redirect)", success: 0, total: 0 };
  if (testCode) {
    // Prime cache
    await request("GET", `/${testCode}`);
    await sleep(300);

    redirectStats = await runConcurrent("GET /{code} (c=50)", 300, () =>
      request("GET", `/${testCode}`),
    );
  } else {
    console.log("  ⚠ No test code available – skipping redirect benchmark");
  }

  // 4. Analytics through gateway
  console.log("\n── Analytics via Gateway ──");
  let analyticsStats = { label: "GET analytics", success: 0, total: 0 };
  if (testCode) {
    // Generate a few clicks first
    for (let i = 0; i < 5; i++) {
      await request("GET", `/${testCode}`);
    }
    await sleep(2000);

    analyticsStats = await runConcurrent("GET analytics (c=25)", 150, () =>
      request("GET", `/api/v1/urls/${testCode}/analytics`),
    );
  }

  // 5. Trending through gateway
  console.log("\n── Trending via Gateway ──");
  const trendingStats = await runConcurrent(
    "GET /api/v1/trending (c=25)",
    150,
    () => request("GET", "/api/v1/trending?limit=20"),
  );

  printSummary("API GATEWAY END-TO-END RESULTS", [
    healthStats,
    createStats,
    redirectStats,
    analyticsStats,
    trendingStats,
  ]);

  return [
    healthStats,
    createStats,
    redirectStats,
    analyticsStats,
    trendingStats,
  ];
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
