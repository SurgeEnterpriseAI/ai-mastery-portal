import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { getScheduledSession, listTrainees, getAppState, markInvited } from "@/lib/data";
import { sendMail, inviteEmail } from "@/lib/email";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const session = await getScheduledSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const recipients = (await listTrainees()).map((t) => t.email);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Add at least one trainee first" }, { status: 400 });
  }

  const { cohortName } = await getAppState();
  const portalUrl = `${new URL(req.url).origin}/present/${session.day}`;
  const { subject, body } = inviteEmail({
    cohortName,
    dayNumber: session.day,
    dayTitle: session.title,
    date: session.date,
    time: session.time,
    portalUrl,
  });
  const { delivered } = await sendMail({ to: recipients, subject, body, kind: "invite" });

  await markInvited(id);

  return NextResponse.json({
    ok: true,
    delivered,
    count: recipients.length,
    message: delivered
      ? `Invites emailed to ${recipients.length} trainee(s).`
      : `Invites recorded for ${recipients.length} trainee(s) (saved to Outbox — configure SMTP env vars to actually deliver).`,
  });
}
