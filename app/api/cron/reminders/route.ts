import { NextResponse } from "next/server";
import { dueClassReminders } from "@/lib/cohorts";
import { sendMail, classReminderEmail } from "@/lib/email";
import { getSessionTrainerId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pre-class reminders (Vercel Cron, daily). Emails confirmed learners whose
// cohort has a session today. Also runnable manually by signed-in staff.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authed =
    (secret && req.headers.get("authorization") === `Bearer ${secret}`) ||
    Boolean(getSessionTrainerId());
  if (secret && !authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const origin = new URL(req.url).origin;
  const joinUrl = `${origin}/class/live`;

  const groups = await dueClassReminders(today);
  let sent = 0;
  for (const g of groups) {
    for (const l of g.learners) {
      const m = classReminderEmail({ name: l.name, cohortName: g.cohortName, date: g.date, joinUrl });
      await sendMail({ to: [l.email], subject: m.subject, body: m.body, kind: "invite" });
      sent++;
    }
  }
  return NextResponse.json({ ok: true, date: today, cohorts: groups.length, reminded: sent });
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
