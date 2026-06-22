import { NextResponse } from "next/server";
import { getTrainer, isValidTrainerResetToken, updateTrainerPassword } from "@/lib/data";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Trainer reset: set a new password using a valid reset token, then sign in.
export async function POST(req: Request) {
  const rl = await rateLimit(`treset:${clientIp(req)}`, 10, 300);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password) return NextResponse.json({ error: "Token and new password required" }, { status: 400 });
  if (String(password).length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  if (!(await isValidTrainerResetToken(String(token)))) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }
  await updateTrainerPassword(hashPassword(String(password))); // also clears the token
  const trainer = await getTrainer();
  setSessionCookie(trainer.id);
  return NextResponse.json({ ok: true });
}
