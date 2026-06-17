import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { getAppState, listTrainees, sessionsForDay } from "@/lib/data";
import { getDay, TOTAL_DAYS } from "@/lib/curriculum";
import { sendMail, announcementEmail } from "@/lib/email";

/**
 * Sends the "what's coming next" announcement to the whole class.
 * By default it announces the cohort's current (next-to-teach) day and pulls
 * the previous day's nextDayTeaser so the message reads like a real preview.
 */
export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { cohortName, progress } = await getAppState();

  const targetDay = Number(body.day) || progress.currentDay;
  if (targetDay > TOTAL_DAYS) {
    return NextResponse.json({ error: "Course complete — no next day to announce." }, { status: 400 });
  }
  const recipients = (await listTrainees()).map((t) => t.email);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Add at least one trainee first" }, { status: 400 });
  }

  const nextContent = getDay(targetDay);
  const prevContent = getDay(targetDay - 1);
  const teaser =
    prevContent?.nextDayTeaser ||
    nextContent?.storyHook ||
    `Get ready for Day ${targetDay}: ${nextContent?.title || ""}.`;

  // attach the next matching scheduled session date/time if one exists
  const upcoming = (await sessionsForDay(targetDay))
    .filter((s) => s.status !== "completed")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  const portalUrl = `${new URL(req.url).origin}/present/${targetDay}`;
  const { subject, body: mailBody } = announcementEmail({
    cohortName,
    dayNumber: targetDay,
    dayTitle: nextContent?.title || `Day ${targetDay}`,
    teaser,
    date: upcoming?.date,
    time: upcoming?.time,
    portalUrl,
  });
  const { delivered } = await sendMail({ to: recipients, subject, body: mailBody, kind: "announcement" });

  return NextResponse.json({
    ok: true,
    delivered,
    count: recipients.length,
    day: targetDay,
    message: delivered
      ? `Announcement for Day ${targetDay} emailed to ${recipients.length} trainee(s).`
      : `Announcement for Day ${targetDay} saved to Outbox (${recipients.length} recipient(s)). Configure SMTP env vars to deliver.`,
  });
}
