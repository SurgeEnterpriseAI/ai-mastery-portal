import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { sendMail } from "@/lib/email";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { to } = await req.json().catch(() => ({}));
  const db = await readDB();
  const recipient = to || db.trainer.email;
  const { delivered } = await sendMail({
    to: [recipient],
    subject: "✅ AI Mastery Portal — test email",
    body: "This is a test from your AI Mastery Portal.\n\nIf you received this by email, SMTP delivery is working. If you only see it in the Outbox, set SMTP_HOST / SMTP_USER / SMTP_PASS to enable real delivery.",
    kind: "test",
  });
  return NextResponse.json({
    ok: true,
    delivered,
    message: delivered
      ? `Test email delivered to ${recipient}.`
      : `Test email saved to Outbox (SMTP not configured). It would go to ${recipient}.`,
  });
}
