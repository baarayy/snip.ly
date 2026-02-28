/**
 * API client for the URL Shortener backend.
 *
 * When running inside Docker, Next.js rewrites proxy to the api-gateway.
 * For local dev outside Docker, we hit the gateway directly on :8080.
 */

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    : process.env.INTERNAL_API_URL || "http://api-gateway:80";

/* ── Types ──────────────────────────────────────────────── */

export interface CreateUrlRequest {
  longUrl: string;
  customAlias?: string;
  expiryDate?: string;
}

export interface CreateUrlResponse {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
  expiryDate: string | null;
  createdAt: string;
}

export interface AnalyticsResponse {
  shortCode: string;
  totalClicks: number;
  clicksByCountry: Record<string, number>;
  clicksByDate: Record<string, number>;
  recentClicks: Array<{
    timestamp: string;
    ip_address: string;
    user_agent: string;
    referrer: string;
    country: string;
  }>;
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: "up" | "down" | "loading";
  latency?: number;
}

export interface TrendingItem {
  shortCode: string;
  longUrl: string | null;
  totalClicks: number;
  rank: number;
}

export interface TrendingResponse {
  trending: TrendingItem[];
  total: number;
}

/* ── API functions ──────────────────────────────────────── */

export async function createShortUrl(
  data: CreateUrlRequest,
): Promise<CreateUrlResponse> {
  const res = await fetch(`${API_BASE}/api/v1/urls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getAnalytics(
  shortCode: string,
): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/urls/${shortCode}/analytics`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function checkServiceHealth(
  name: string,
  url: string,
): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - start;
    return {
      name,
      url,
      status: res.ok ? "up" : "down",
      latency,
    };
  } catch {
    return { name, url, status: "down", latency: Date.now() - start };
  }
}

export function getRedirectUrl(shortCode: string): string {
  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      : "http://localhost:8080";
  return `${base}/${shortCode}`;
}

export async function getTrending(
  limit: number = 10,
): Promise<TrendingResponse> {
  const res = await fetch(`${API_BASE}/api/v1/trending?limit=${limit}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
