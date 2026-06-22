import { NextResponse } from "next/server";
import { prisma } from "@/lib/data";
import { listCohorts } from "@/lib/cohorts";
import { sendMail, batchInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// TEMPORARY token-guarded email diagnostic + test-send. Removed after use.
const TOKEN = "tp-mail-3a8f21";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Send a real Cohort-1 invite to a single address, so we can see exactly what a student gets.
  const to = url.searchParams.get("to");
  if (to) {
    const cohorts = await listCohorts();
    const cohort = cohorts.find((c) => /cohort\s*1/i.test(c.name)) || cohorts[0];
    const mail = batchInviteEmail({
      name: "there",
      cohortName: cohort?.name || "Tensorpath — Cohort 1",
      startDate: cohort?.startDate,
      classTime: cohort?.classTime,
      sessionDates: cohort?.sessionDates || [],
      portalUrl: "https://tensorpath.in/learn",
    });
    const r = await sendMail({ to: [to], subject: mail.subject, body: mail.body, kind: "invite" });
    return NextResponse.json({ sentTo: to, delivered: r.delivered, via: r.via, subject: mail.subject, classTime: cohort?.classTime || null });
  }

  // Delivery diagnostic
  const rows = await prisma.outboxMail.findMany({ orderBy: { sentAt: "desc" }, take: 120 });
  const byVia: Record<string, number> = {};
  const byKind: Record<string, { delivered: number; queued: number }> = {};
  for (const m of rows) {
    byVia[m.via] = (byVia[m.via] || 0) + 1;
    byKind[m.kind] = byKind[m.kind] || { delivered: 0, queued: 0 };
    if (m.delivered) byKind[m.kind].delivered++; else byKind[m.kind].queued++;
  }
  return NextResponse.json({
    mailFromSet: Boolean(process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER),
    resendKeySet: Boolean(process.env.RESEND_API_KEY),
    smtpSet: Boolean(process.env.SMTP_HOST),
    totalRecent: rows.length, byVia, byKind,
  });
}
