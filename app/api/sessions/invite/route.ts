import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { mutateDB, readDB } from "@/lib/db";
import { sendMail, inviteEmail } from "@/lib/email";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const db = await readDB();
  const session = db.sessions.find((s) => s.id === id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const recipients = db.trainees.map((t) => t.email);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Add at least one trainee first" }, { status: 400 });
  }

  const portalUrl = `${new URL(req.url).origin}/present/${session.day}`;
  const { subject, body } = inviteEmail({
    cohortName: db.cohortName,
    dayNumber: session.day,
    dayTitle: session.title,
    date: session.date,
    time: session.time,
    portalUrl,
  });
  const { delivered } = await sendMail({ to: recipients, subject, body, kind: "invite" });

  await mutateDB((d) => {
    const s = d.sessions.find((x) => x.id === id);
    if (s) s.invitesSent = true;
  });

  return NextResponse.json({
    ok: true,
    delivered,
    count: recipients.length,
    message: delivered
      ? `Invites emailed to ${recipients.length} trainee(s).`
      : `Invites recorded for ${recipients.length} trainee(s) (saved to Outbox — configure SMTP env vars to actually deliver).`,
  });
}
