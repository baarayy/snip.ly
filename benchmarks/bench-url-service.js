/**
 * Benchmark: URL Service – POST /api/v1/urls
 *
 * Tests URL creation throughput and latency under increasing concurrency.
 */
const { request, runLoadPhases, printSummary, sleep } = require("./utils");

const LONG_URLS = [
  "https://www.google.com/search?q=system+design+interview",
  "https://github.com/topics/microservices",
  "https://en.wikipedia.org/wiki/URL_shortening",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://stackoverflow.com/questions/tagged/distributed-systems",
  "https://docs.spring.io/spring-boot/docs/current/reference/html/",
  "https://nestjs.com/",
  "https://www.djangoproject.com/",
  "https://redis.io/docs/latest/",
  "https://www.rabbitmq.com/tutorials",
];

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   URL Service Benchmark – POST /api/v1/urls  ║");
  console.log("╚══════════════════════════════════════════════╝");

  // Warm up
  console.log("\n  Warming up...");
  for (let i = 0; i < 5; i++) {
    await request("POST", "/api/v1/urls", {
      longUrl: LONG_URLS[i % LONG_URLS.length] + `?warmup=${i}&t=${Date.now()}`,
    });
  }
  await sleep(500);

  const phases = [
    { concurrency: 1, requests: 20 },
    { concurrency: 5, requests: 50 },
    { concurrency: 10, requests: 100 },
    { concurrency: 25, requests: 200 },
    { concurrency: 50, requests: 300 },
  ];

  let counter = 0;
  const allStats = await runLoadPhases("URL Creation", phases, (i) =>
    request("POST", "/api/v1/urls", {
      longUrl:
        LONG_URLS[i % LONG_URLS.length] + `?bench=${++counter}&t=${Date.now()}`,
    }),
  );

  printSummary("URL SERVICE BENCHMARK RESULTS", allStats);
  return allStats;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
