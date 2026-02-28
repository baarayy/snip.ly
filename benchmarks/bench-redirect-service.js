/**
 * Benchmark: Redirect Service – GET /{shortCode}
 *
 * First creates a few short URLs, then hammers redirects to test
 * Redis cache performance and redirect latency.
 */
const { request, runLoadPhases, printSummary, sleep } = require("./utils");

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Redirect Service Benchmark – GET /{shortCode}  ║");
  console.log("╚══════════════════════════════════════════════════╝");

  // Create test URLs to redirect
  console.log("\n  Creating test URLs...");
  const shortCodes = [];
  for (let i = 0; i < 5; i++) {
    try {
      const res = await request("POST", "/api/v1/urls", {
        longUrl: `https://example.com/bench-redirect-${i}?t=${Date.now()}`,
      });
      if (res.body && res.body.shortCode) {
        shortCodes.push(res.body.shortCode);
      }
    } catch (e) {
      console.log(`  ⚠ Failed to create test URL ${i}: ${e.message}`);
    }
  }

  if (shortCodes.length === 0) {
    console.log("  ✗ No short codes created – cannot benchmark redirects");
    return [];
  }
  console.log(
    `  Created ${shortCodes.length} test URLs: ${shortCodes.join(", ")}`,
  );

  // Warm up — prime the Redis cache
  console.log("\n  Warming up (priming cache)...");
  for (const code of shortCodes) {
    await request("GET", `/${code}`);
  }
  await sleep(500);

  const phases = [
    { concurrency: 1, requests: 30 },
    { concurrency: 10, requests: 100 },
    { concurrency: 25, requests: 200 },
    { concurrency: 50, requests: 400 },
    { concurrency: 100, requests: 500 },
  ];

  const allStats = await runLoadPhases("Redirect (cached)", phases, (i) =>
    request("GET", `/${shortCodes[i % shortCodes.length]}`),
  );

  // Also test redirect for non-existent codes (404 path)
  console.log("\n  Testing 404 path (non-existent short codes)...");
  const miss404 = await runLoadPhases(
    "Redirect (404 miss)",
    [{ concurrency: 20, requests: 100 }],
    (i) => request("GET", `/zzz404${i}`),
  );

  printSummary("REDIRECT SERVICE BENCHMARK RESULTS", [...allStats, ...miss404]);
  return allStats;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
