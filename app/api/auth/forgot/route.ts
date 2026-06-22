import { NextResponse } from "next/server";
import crypto from "crypto";
import { getTrainer, setTrainerResetToken } from "@/lib/data";
import { sendMail, passwordResetEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Trainer forgot-password: emails a reset link if the email matches the trainer account.
export async function POST(req: Request) {
  const rl = await rateLimit(`tforgot:${clientIp(req)}`, 5, 300);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const trainer = await getTrainer();
  if (String(email).trim().toLowerCase() === trainer.email.toLowerCase()) {
    const token = crypto.randomBytes(24).toString("base64url");
    const exp = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await setTrainerResetToken(token, exp);
    const origin = new URL(req.url).origin;
    const mail = passwordResetEmail({ name: trainer.name, resetUrl: `${origin}/login/reset?token=${token}` });
    await sendMail({ to: [trainer.email], subject: mail.subject, body: mail.body, kind: "welcome" });
  }
  // Always the same response — don't reveal the trainer email.
  return NextResponse.json({ ok: true });
}
