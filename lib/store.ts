import fs from "fs";
import path from "path";

/**
 * Pluggable async key/value persistence.
 *  - Production (Vercel): Upstash Redis REST, using the KV_REST_API_URL / KV_REST_API_TOKEN
 *    env vars that Vercel KV injects (also accepts UPSTASH_REDIS_REST_URL / _TOKEN).
 *  - Local dev / no KV configured: a JSON file under ./data.
 */

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export function usingRedis(): boolean {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

// ---- Redis REST backend ----

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV get failed: ${res.status}`);
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

async function redisSet(key: string, value: string): Promise<void> {
  // POST body is the raw value; Upstash stores it as-is
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "text/plain" },
    body: value,
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
}

// ---- File backend ----

const DATA_DIR = path.join(process.cwd(), "data");

function filePath(key: string): string {
  return path.join(DATA_DIR, `${key.replace(/[^a-z0-9_-]/gi, "_")}.json`);
}

function fileGet(key: string): string | null {
  const p = filePath(key);
  if (!fs.existsSync(p)) return null;
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}

function fileSet(key: string, value: string): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(key), value, "utf-8");
}

// ---- Public API ----

export async function storeGet(key: string): Promise<string | null> {
  return usingRedis() ? redisGet(key) : fileGet(key);
}

export async function storeSet(key: string, value: string): Promise<void> {
  if (usingRedis()) await redisSet(key, value);
  else fileSet(key, value);
}
