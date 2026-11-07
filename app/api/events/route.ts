import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FIRST_TOUCH_COOKIE, INTERNAL_COOKIE, realIp, recordPageview } from "@/lib/events";
import { rateLimit } from "@/lib/ratelimit";

// Public: one pageview from components/SiteTracker. Never fails the page; always 204.
export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const ip = realIp(req);
    const rl = await rateLimit(`ev:${ip || "anon"}`, 120, 60);
    if (!rl.ok) return done;
    const b = await req.json().catch(() => ({}));
    const path = String(b.path || "/").slice(0, 600);
    if (!path.startsWith("/")) return done;
    const jar = cookies();
    const source = await recordPageview(path, String(b.referrer || "").slice(0, 600), {
      ip,
      ua: req.headers.get("user-agent") || "",
      host: req.headers.get("host") || "",
      country: req.headers.get("cf-ipcountry") || "",
      internal: jar.get(INTERNAL_COOKIE)?.value === "1",
    });
    // First touch: where this browser first came from, kept 90 days and stored on sign-up / enquiry.
    if (source && !jar.get(FIRST_TOUCH_COOKIE)) {
      done.cookies.set(FIRST_TOUCH_COOKIE, source, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 90 * 86400 });
    }
  } catch (e) {
    console.error("events: pageview not stored", (e as Error).message);
  }
  return done;
}
