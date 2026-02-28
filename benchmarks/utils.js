/**
 * Shared utilities for benchmark scripts.
 * Uses only built-in Node.js modules (http/https).
 */
const http = require("http");

const GATEWAY = process.env.GATEWAY_URL || "http://localhost:8080";

/**
 * Make an HTTP request and return { statusCode, body, latencyMs }.
 */
function request(method, path, body = null, baseUrl = GATEWAY) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    const start = process.hrtime.bigint();
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null,
            latencyMs,
          });
        } catch {
          resolve({ statusCode: res.statusCode, body: data, latencyMs });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timeout"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Run N concurrent requests, measuring aggregate stats.
 */
async function runConcurrent(label, count, fn) {
  const start = process.hrtime.bigint();
  const results = [];
  const errors = [];

  // Fire all requests concurrently
  const promises = Array.from({ length: count }, (_, i) =>
    fn(i)
      .then((r) => results.push(r))
      .catch((e) => errors.push(e)),
  );

  await Promise.all(promises);

  const totalMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);

  if (latencies.length === 0) {
    console.log(`  ⚠ ${label}: ALL ${count} requests failed`);
    return { label, total: count, success: 0, failed: errors.length };
  }

  const stats = {
    label,
    total: count,
    success: results.length,
    failed: errors.length,
    rps: ((results.length / totalMs) * 1000).toFixed(1),
    totalMs: totalMs.toFixed(0),
    min: latencies[0].toFixed(1),
    avg: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1),
    p50: latencies[Math.floor(latencies.length * 0.5)].toFixed(1),
    p95: latencies[Math.floor(latencies.length * 0.95)].toFixed(1),
    p99: latencies[Math.floor(latencies.length * 0.99)].toFixed(1),
    max: latencies[latencies.length - 1].toFixed(1),
  };

  console.log(
    `  ✓ ${stats.label}: ${stats.success}/${stats.total} ok | ` +
      `${stats.rps} req/s | ` +
      `avg=${stats.avg}ms p50=${stats.p50}ms p95=${stats.p95}ms p99=${stats.p99}ms max=${stats.max}ms`,
  );

  return stats;
}

/**
 * Run requests in sequential phases with increasing concurrency.
 */
async function runLoadPhases(label, phases, fn) {
  console.log(`\n── ${label} ──`);
  const allStats = [];
  for (const { concurrency, requests: count } of phases) {
    console.log(
      `\n  Phase: ${concurrency} concurrent, ${count} total requests`,
    );
    const stats = await runConcurrent(`${label} (c=${concurrency})`, count, fn);
    allStats.push({ concurrency, ...stats });
  }
  return allStats;
}

/**
 * Pretty-print a summary table.
 */
function printSummary(title, allResults) {
  console.log(`\n${"═".repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(80)}`);
  console.log(
    "  " +
      "Test".padEnd(35) +
      "OK/Total".padEnd(12) +
      "RPS".padEnd(10) +
      "Avg".padEnd(10) +
      "P95".padEnd(10) +
      "P99".padEnd(10) +
      "Max".padEnd(10),
  );
  console.log("  " + "─".repeat(77));
  for (const r of allResults) {
    if (!r.rps) continue;
    console.log(
      "  " +
        (r.label || "").padEnd(35) +
        `${r.success}/${r.total}`.padEnd(12) +
        `${r.rps}/s`.padEnd(10) +
        `${r.avg}ms`.padEnd(10) +
        `${r.p95}ms`.padEnd(10) +
        `${r.p99}ms`.padEnd(10) +
        `${r.max}ms`.padEnd(10),
    );
  }
  console.log(`${"═".repeat(80)}\n`);
}

/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  GATEWAY,
  request,
  runConcurrent,
  runLoadPhases,
  printSummary,
  sleep,
};
