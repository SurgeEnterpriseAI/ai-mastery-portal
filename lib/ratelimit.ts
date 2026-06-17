const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

// in-memory fallback (per serverless instance) for local dev / no-KV
const mem = new Map<string, { count: number; resetAt: number }>();

async function redis(cmd: string[]): Promise<any> {
  const res = await fetch(`${REDIS_URL}/${cmd.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${cmd[0]} failed: ${res.status}`);
  return (await res.json()).result;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0].trim() : "") || req.headers.get("x-real-ip") || "anon";
}

/**
 * Fixed-window rate limit. Returns { ok, remaining, retryAfter }.
 * Fails open (allows the request) if the limiter backend errors.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const k = `aimp:rl:${key}`;
  try {
    if (useRedis) {
      const count = (await redis(["INCR", k])) as number;
      if (count === 1) await redis(["EXPIRE", k, String(windowSec)]);
      const ttl = count > limit ? ((await redis(["TTL", k])) as number) : 0;
      return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter: Math.max(0, ttl) };
    }
    const now = Date.now();
    const e = mem.get(k);
    if (!e || e.resetAt < now) {
      mem.set(k, { count: 1, resetAt: now + windowSec * 1000 });
      return { ok: true, remaining: limit - 1, retryAfter: 0 };
    }
    e.count += 1;
    return { ok: e.count <= limit, remaining: Math.max(0, limit - e.count), retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  } catch (err) {
    console.error("[ratelimit] backend error, failing open:", (err as Error).message);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

/** Convenience: 429 JSON response. */
export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: `Too many requests. Try again in ${retryAfter}s.` }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter || 1) },
  });
}
