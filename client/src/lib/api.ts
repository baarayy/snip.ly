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
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByOS: Record<string, number>;
  clicksByReferrerCategory: Record<string, number>;
  topReferrerDomains: Array<{ domain: string; count: number }>;
  utmBreakdown: Array<{
    source: string;
    medium: string;
    campaign: string;
    count: number;
  }>;
  hourlyTrend: Array<{ hour: string; clicks: number }>;
  recentClicks: Array<{
    timestamp: string;
    ip_address: string;
    user_agent: string;
    referrer: string;
    country: string;
    device_type: string;
    os: string;
    browser: string;
    referrer_category: string;
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
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  page: number = 1,
  pageSize: number = 20,
): Promise<TrendingResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/trending?page=${page}&pageSize=${pageSize}`,
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

/* ── Auth Types ─────────────────────────────────────────── */

export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  provider: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface APIKeyInfo {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  period: string;
  totalClicks: number;
  uniqueShortCodes: number;
  topDevices: Record<string, number>;
  topBrowsers: Record<string, number>;
  topCountries: Record<string, number>;
  referrerCategories: Record<string, number>;
  dailyTrend: Array<{ date: string; clicks: number }>;
  botTrafficPercent: number;
}

/* ── Auth API Functions ─────────────────────────────────── */

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Registration failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function refreshToken(
  refreshTokenStr: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshTokenStr }),
  });

  if (!res.ok) {
    throw new Error("Token refresh failed");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
  } catch {
    // Ignore errors on logout
  }
}

export async function getProfile(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/api/v1/me`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function getMyUrls(
  page: number = 1,
  pageSize: number = 20,
): Promise<{
  urls: Array<{
    id: number;
    short_code: string;
    original_url: string;
    click_count: number;
    created_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  const res = await fetch(
    `${API_BASE}/api/v1/my/urls?page=${page}&pageSize=${pageSize}`,
    { headers: getAuthHeaders() },
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function createAPIKey(
  name: string,
  scopes: string[] = ["read", "write"],
): Promise<{ apiKey: APIKeyInfo; rawKey: string }> {
  const res = await fetch(`${API_BASE}/api/v1/api-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, scopes }),
  });

  if (!res.ok) {
    throw new Error("Failed to create API key");
  }

  return res.json();
}

export async function listAPIKeys(): Promise<{ apiKeys: APIKeyInfo[] }> {
  const res = await fetch(`${API_BASE}/api/v1/api-keys`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function revokeAPIKey(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/api-keys/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to revoke API key");
  }
}

export function getOAuthGoogleUrl(): string {
  return `${API_BASE}/api/v1/auth/oauth/google`;
}

export function getOAuthGitHubUrl(): string {
  return `${API_BASE}/api/v1/auth/oauth/github`;
}

export async function getAnalyticsSummary(
  period: string = "7d",
): Promise<AnalyticsSummary> {
  const res = await fetch(
    `${API_BASE}/api/v1/analytics/summary?period=${period}`,
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export function getAnalyticsExportUrl(
  shortCode: string,
  format: "csv" | "json" = "json",
): string {
  return `${API_BASE}/api/v1/urls/${shortCode}/analytics/export?format=${format}`;
}
