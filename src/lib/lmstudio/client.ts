import OpenAI from "openai";
import { getIntegrationConfig } from "@/lib/integrations/config";

const DEFAULT_BASE_URL = "http://localhost:1234/v1";

/**
 * Resolve the Local LLM base URL. Order of precedence:
 * 1. DB integration_config ("local_llm" → "base_url")
 * 2. LMSTUDIO_URL environment variable
 * 3. Default (http://localhost:1234/v1)
 */
export function getBaseUrl(): string {
  try {
    const dbUrl = getIntegrationConfig("local_llm", "base_url");
    if (dbUrl && dbUrl.trim()) return dbUrl.trim();
  } catch {
    // DB not ready yet — fall through to env
  }
  const env = (process.env.LMSTUDIO_URL || "").trim();
  return env || DEFAULT_BASE_URL;
}

export function getLmStudioClient(): OpenAI {
  // Create fresh each time so URL changes via settings UI take effect immediately.
  return new OpenAI({ baseURL: getBaseUrl(), apiKey: "lm-studio" });
}

let healthCache: { url: string; available: boolean; checkedAt: number } | null = null;
const HEALTH_CACHE_TTL = 30_000; // 30 seconds

export async function checkLmStudioHealth(): Promise<boolean> {
  const url = getBaseUrl();
  const now = Date.now();
  if (
    healthCache &&
    healthCache.url === url &&
    now - healthCache.checkedAt < HEALTH_CACHE_TTL
  ) {
    return healthCache.available;
  }

  try {
    const baseURL = url.replace(/\/v1\/?$/, "");
    const response = await fetch(`${baseURL}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    const available = response.ok;
    healthCache = { url, available, checkedAt: now };
    return available;
  } catch {
    healthCache = { url, available: false, checkedAt: now };
    return false;
  }
}

export function isLmStudioAvailable(): boolean {
  if (!healthCache) return false;
  if (Date.now() - healthCache.checkedAt > HEALTH_CACHE_TTL) return false;
  return healthCache.available;
}

/**
 * Force a fresh health check (bypasses cache). Used after updating settings.
 */
export async function testLmStudioConnection(
  overrideBaseUrl?: string
): Promise<{ ok: boolean; error?: string; modelCount?: number }> {
  const url = (overrideBaseUrl?.trim() || getBaseUrl()).replace(/\/v1\/?$/, "");
  try {
    const response = await fetch(`${url}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status} ${response.statusText}` };
    }
    const data = (await response.json()) as { data?: unknown[] };
    return { ok: true, modelCount: Array.isArray(data.data) ? data.data.length : undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return { ok: false, error: msg };
  }
}
