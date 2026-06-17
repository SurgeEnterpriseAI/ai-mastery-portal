import { NextResponse } from "next/server";
import { getLearnerByEmail } from "@/lib/data";
import { verifyPassword, setLearnerCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const rl = await rateLimit(`llogin:${clientIp(req)}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  const learner = await getLearnerByEmail(String(email));
  if (!learner || !verifyPassword(String(password), learner.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  setLearnerCookie(learner.id);
  return NextResponse.json({ ok: true });
}
