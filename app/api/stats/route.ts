import { NextResponse } from "next/server";
import { prisma } from "@/lib/data";

export const dynamic = "force-dynamic";

// TEMPORARY token-guarded email-delivery diagnostic. Read once, then removed.
const TOKEN = "tp-mail-3a8f21";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const rows = await prisma.outboxMail.findMany({ orderBy: { sentAt: "desc" }, take: 120 });
  const byVia: Record<string, number> = {};
  const byKind: Record<string, { delivered: number; queued: number }> = {};
  for (const m of rows) {
    byVia[m.via] = (byVia[m.via] || 0) + 1;
    byKind[m.kind] = byKind[m.kind] || { delivered: 0, queued: 0 };
    if (m.delivered) byKind[m.kind].delivered++; else byKind[m.kind].queued++;
  }
  const invites = rows.filter((m) => m.kind === "invite").slice(0, 6).map((m) => ({
    to: m.to, delivered: m.delivered, via: m.via, sentAt: m.sentAt, subject: m.subject,
  }));
  return NextResponse.json({
    mailFromSet: Boolean(process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER),
    resendKeySet: Boolean(process.env.RESEND_API_KEY),
    smtpSet: Boolean(process.env.SMTP_HOST),
    totalRecent: rows.length, byVia, byKind, sampleInvites: invites,
  });
}
