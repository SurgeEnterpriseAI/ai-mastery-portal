/**
 * First-party, cookieless pageviews for Surge HQ (7 Nov 2026), same contract as the other Surge sites.
 * A visitor is HMAC(key, IST day + IP + user agent): the same person counts once a day and can't be
 * followed across days. Bots, local hosts, staff pages and the founder's own browsers (cookie
 * tp_internal=1, set by opening any page with ?internal=1) are not counted.
 *
 * Source: `utm:<utm_source>` when the landing URL carries one (DM links use ?utm_source=li-dm etc.),
 * else the referrer's site (google, chatgpt, linkedin…), else "direct".
 */
import crypto from "crypto";
import { prisma } from "./data";

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview|lighthouse|headless|python-requests|curl|wget|httpclient|go-http|axios|node-fetch|monitor|uptime/i;
export const isBot = (ua: string) => !ua || BOT.test(ua);

const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|.*\.local$|.*\.test$)/i;
export const isLocalHost = (host: string) => LOCAL_HOST.test(host.split(":")[0] ?? "");

/** Staff and app-internal pages: not marketing traffic. */
const STAFF_PATH = /^\/(trainer|admin|present|login|api)(\/|$)/;
export const isStaffPath = (path: string) => STAFF_PATH.test(path);

export const FIRST_TOUCH_COOKIE = "tp_ft";
export const INTERNAL_COOKIE = "tp_internal";

/** The date in India (IST, UTC+5:30), which is how the founder reads "today". */
export function istDay(at = new Date()): string {
  return new Date(at.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export function visitorHash(key: string, day: string, ip: string, ua: string): string {
  return crypto.createHmac("sha256", key).update(`${day}\n${ip}\n${ua}`).digest("hex").slice(0, 32);
}

/** utm_source from a path's query string, cleaned to a short tag. */
export function utmTag(path: string): string {
  const q = path.indexOf("?");
  if (q < 0) return "";
  const v = new URLSearchParams(path.slice(q + 1)).get("utm_source") || "";
  return v.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
}

/** Where a visit came from, by utm tag or referrer host. Internal navigation counts as direct. */
export function classifySource(path: string, referrer: string, ownHost: string): string {
  const tag = utmTag(path);
  if (tag) return `utm:${tag}`;
  let host = "";
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return "direct"; }
  const own = ownHost.split(":")[0].replace(/^www\./, "").toLowerCase();
  if (!host || host.replace(/^www\./, "") === own) return "direct";
  const rules: [RegExp, string][] = [
    [/(^|\.)google\./, "google"], [/(^|\.)bing\.com$/, "bing"], [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
    [/chatgpt\.com$|openai\.com$/, "chatgpt"], [/perplexity\.ai$/, "perplexity"], [/(^|\.)claude\.ai$/, "claude"],
    [/gemini\.google\.com$/, "gemini"], [/linkedin\.com$|lnkd\.in$/, "linkedin"], [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
    [/(^|\.)reddit\.com$/, "reddit"], [/(^|\.)github\.com$/, "github"], [/(^|\.)yahoo\./, "yahoo"],
    [/(^|\.)whatsapp\.com$|wa\.me$/, "whatsapp"], [/(^|\.)youtube\.com$|youtu\.be$/, "youtube"],
    [/surgesoftware\.co\.in$/, "surgesoftware"],
  ];
  for (const [re, name] of rules) if (re.test(host)) return name;
  return host.slice(0, 80);
}

/** Path without query string (utm tags live in `source`, not in path). */
export const cleanPath = (path: string) => (path.split("?")[0] || "/").slice(0, 300);

export interface RequestFacts { ip: string; ua: string; host: string; country: string; internal: boolean }

/** The visitor's real IP behind the Cloudflare tunnel. */
export function realIp(req: Request): string {
  const h = req.headers;
  return h.get("cf-connecting-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
}

/** Records one pageview unless it should not count. Returns the source it classified (or null if skipped). */
export async function recordPageview(path: string, referrer: string, r: RequestFacts, env = process.env): Promise<string | null> {
  if (r.internal || isBot(r.ua) || isLocalHost(r.host) || isStaffPath(path)) return null;
  const key = env.PORTAL_SECRET;
  if (!key) return null;
  const day = istDay();
  const source = classifySource(path, referrer, r.host);
  await prisma.siteEvent.create({
    data: {
      id: crypto.randomUUID(),
      day: new Date(`${day}T00:00:00Z`),
      kind: "pageview",
      path: cleanPath(path),
      visitor: visitorHash(key, day, r.ip, r.ua),
      country: r.country.slice(0, 2).toUpperCase(),
      source,
    },
  });
  return source;
}
