import { NextResponse } from "next/server";
import crypto from "crypto";
import { setLearnerResetToken } from "@/lib/data";
import { sendMail, passwordResetEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimit(`forgot:${clientIp(req)}`, 5, 300);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const token = crypto.randomBytes(24).toString("base64url");
  const exp = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  const learner = await setLearnerResetToken(String(email).trim().toLowerCase(), token, exp);

  // Only send if the account exists — but always return the same response so we
  // don't reveal which emails are registered.
  if (learner) {
    const origin = new URL(req.url).origin;
    const mail = passwordResetEmail({ name: learner.name, resetUrl: `${origin}/reset?token=${token}` });
    await sendMail({ to: [learner.email], subject: mail.subject, body: mail.body, kind: "welcome" });
  }
  return NextResponse.json({ ok: true });
}
