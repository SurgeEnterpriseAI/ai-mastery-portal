import { NextResponse } from "next/server";
import { getLearnerByResetToken, setLearnerPassword } from "@/lib/data";
import { hashPassword, setLearnerCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimit(`reset:${clientIp(req)}`, 10, 300);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password) return NextResponse.json({ error: "Token and new password required" }, { status: 400 });
  if (String(password).length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const learner = await getLearnerByResetToken(String(token)); // null if invalid or expired
  if (!learner) return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });

  await setLearnerPassword(learner.id, hashPassword(String(password)));
  setLearnerCookie(learner.id); // log them straight in
  return NextResponse.json({ ok: true });
}
