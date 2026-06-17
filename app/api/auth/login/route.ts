import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const rl = await rateLimit(`login:${clientIp(req)}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const db = await readDB();
  if (db.trainer.email.toLowerCase() !== String(email).toLowerCase()) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!verifyPassword(password, db.trainer.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  setSessionCookie(db.trainer.id);
  return NextResponse.json({ ok: true });
}
