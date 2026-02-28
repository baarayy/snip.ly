/**
 * Run all benchmarks sequentially and produce a combined report.
 *
 * Usage: node run-all.js
 */
const { sleep } = require("./utils");

async function main() {
  const startTime = Date.now();

  console.log("\n" + "█".repeat(70));
  console.log("█  URL SHORTENER — COMPREHENSIVE PERFORMANCE BENCHMARK");
  console.log("█  " + new Date().toISOString());
  console.log("█".repeat(70));

  // 1. URL Service
  console.log("\n\n▶ [1/5] URL SERVICE");
  const urlBench = require("./bench-url-service");
  await urlBench.main();
  await sleep(1000);

  // 2. Redirect Service
  console.log("\n\n▶ [2/5] REDIRECT SERVICE");
  const redirectBench = require("./bench-redirect-service");
  await redirectBench.main();
  await sleep(1000);

  // 3. Analytics Service
  console.log("\n\n▶ [3/5] ANALYTICS SERVICE");
  const analyticsBench = require("./bench-analytics-service");
  await analyticsBench.main();
  await sleep(1000);

  // 4. WebSocket Service
  console.log("\n\n▶ [4/5] WEBSOCKET SERVICE");
  const wsBench = require("./bench-ws-service");
  await wsBench.main();
  await sleep(1000);

  // 5. API Gateway (end-to-end)
  console.log("\n\n▶ [5/5] API GATEWAY (END-TO-END)");
  const gatewayBench = require("./bench-gateway");
  await gatewayBench.main();

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "█".repeat(70));
  console.log(`█  ALL BENCHMARKS COMPLETE — Total time: ${totalSec}s`);
  console.log("█".repeat(70) + "\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
