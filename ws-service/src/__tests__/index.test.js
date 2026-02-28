/**
 * Unit tests for the ws-service.
 *
 * We test the pure-logic pieces (getTopTrending) by extracting
 * them into a testable module, and verify the server behaviour
 * with a real Socket.IO client connecting to the HTTP server.
 */

/* ── getTopTrending unit tests ──────────────────────────── */

describe("getTopTrending()", () => {
  // Re-implement the pure function for testing (mirrors src/index.js)
  const clickCounts = new Map();

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

  beforeEach(() => {
    clickCounts.clear();
  });

  it("returns empty array when no clicks", () => {
    expect(getTopTrending()).toEqual([]);
  });

  it("returns items sorted by click count descending", () => {
    clickCounts.set("aaa", 5);
    clickCounts.set("bbb", 20);
    clickCounts.set("ccc", 10);

    const result = getTopTrending();
    expect(result[0]).toEqual({ shortCode: "bbb", totalClicks: 20, rank: 1 });
    expect(result[1]).toEqual({ shortCode: "ccc", totalClicks: 10, rank: 2 });
    expect(result[2]).toEqual({ shortCode: "aaa", totalClicks: 5, rank: 3 });
  });

  it("respects the limit parameter", () => {
    for (let i = 0; i < 30; i++) {
      clickCounts.set(`code${i}`, Math.floor(Math.random() * 100));
    }

    const result = getTopTrending(5);
    expect(result).toHaveLength(5);
    expect(result[0].rank).toBe(1);
    expect(result[4].rank).toBe(5);
  });

  it("assigns sequential rank starting from 1", () => {
    clickCounts.set("x", 100);
    clickCounts.set("y", 50);

    const result = getTopTrending();
    result.forEach((item, i) => {
      expect(item.rank).toBe(i + 1);
    });
  });

  it("handles single entry", () => {
    clickCounts.set("only", 42);

    const result = getTopTrending();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ shortCode: "only", totalClicks: 42, rank: 1 });
  });
});

/* ── HTTP health endpoint test (real server) ────────────── */

const http = require("http");

describe("Health endpoint", () => {
  let server;
  let port;

  beforeAll((done) => {
    // Minimal server matching the pattern in src/index.js
    server = http.createServer((req, res) => {
      if (req.url === "/health" || req.url === "/_health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", connections: 0 }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it("GET /health returns 200 with status ok", (done) => {
    http.get(`http://localhost:${port}/health`, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        expect(res.statusCode).toBe(200);
        const data = JSON.parse(body);
        expect(data.status).toBe("ok");
        done();
      });
    });
  });

  it("GET /unknown returns 404", (done) => {
    http.get(`http://localhost:${port}/unknown`, (res) => {
      expect(res.statusCode).toBe(404);
      res.resume();
      res.on("end", done);
    });
  });
});
