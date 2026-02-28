/**
 * Benchmark: Analytics Service – GET /api/v1/urls/{shortCode}/analytics
 *                               GET /api/v1/trending
 *
 * Tests analytics read performance under load.
 */
const { request, runLoadPhases, printSummary, sleep } = require("./utils");

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   Analytics Service Benchmark – Analytics & Trending  ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  // Create a URL and trigger some clicks to generate analytics data
  console.log("\n  Setting up test data...");
  let testCode = null;
  try {
    const createRes = await request("POST", "/api/v1/urls", {
      longUrl: `https://example.com/analytics-bench?t=${Date.now()}`,
    });
    testCode = createRes.body?.shortCode;
  } catch {
    console.log("  ⚠ Could not create test URL");
  }

  if (testCode) {
    console.log(`  Created test URL: ${testCode}`);
    // Generate clicks
    console.log("  Generating click events...");
    for (let i = 0; i < 15; i++) {
      await request("GET", `/${testCode}`);
    }
    // Wait for analytics consumer to process events
    console.log("  Waiting for analytics pipeline (3s)...");
    await sleep(3000);
  } else {
    testCode = "nonexistent";
    console.log("  Using fallback code — results may all be 404");
  }

  // Benchmark analytics endpoint
  const analyticsPhases = [
    { concurrency: 1, requests: 20 },
    { concurrency: 5, requests: 50 },
    { concurrency: 10, requests: 100 },
    { concurrency: 25, requests: 200 },
  ];

  const analyticsStats = await runLoadPhases(
    "Analytics Read",
    analyticsPhases,
    () => request("GET", `/api/v1/urls/${testCode}/analytics`),
  );

  // Benchmark trending endpoint
  const trendingPhases = [
    { concurrency: 1, requests: 20 },
    { concurrency: 5, requests: 50 },
    { concurrency: 10, requests: 100 },
    { concurrency: 25, requests: 200 },
  ];

  const trendingStats = await runLoadPhases(
    "Trending Read",
    trendingPhases,
    () => request("GET", "/api/v1/trending?limit=20"),
  );

  printSummary("ANALYTICS SERVICE BENCHMARK RESULTS", [
    ...analyticsStats,
    ...trendingStats,
  ]);

  return { analyticsStats, trendingStats };
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
