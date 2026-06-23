import crypto from "crypto";
import { prisma, newId } from "./data";
import { listCohorts, cohortRoster } from "./cohorts";
import { getDay } from "./curriculum";
import { sendBatchEmails, classInviteEmail, classStartingNowEmail } from "./email";

export interface RsvpCounts { invited: number; confirmed: number; declined: number }

function dayNumberFor(sessionDates: string[], date: string): number | undefined {
  const i = sessionDates.indexOf(date);
  return i >= 0 ? i + 1 : undefined;
}

// Per-class invite: ensure an RSVP row (with a one-click token) for every roster
// learner on `date`, and email them confirm/decline links. Existing RSVPs keep
// their status + token (so a re-send doesn't wipe a confirmation).
export async function inviteClass(cohortId: string, date: string, origin: string): Promise<{ invited: number; delivered: number }> {
  const cohorts = await listCohorts();
  const cohort = cohorts.find((c) => c.id === cohortId);
  if (!cohort) return { invited: 0, delivered: 0 };
  const roster = await cohortRoster(cohortId);
  if (!roster.length) return { invited: 0, delivered: 0 };

  const dayNumber = dayNumberFor(cohort.sessionDates, date);
  const day = dayNumber ? getDay(dayNumber) : null;
  const items: Array<{ to: string; subject: string; body: string; kind: "invite" }> = [];

  for (const l of roster) {
    const existing = await prisma.sessionRsvp.findUnique({ where: { cohortId_learnerId_sessionDate: { cohortId, learnerId: l.id, sessionDate: date } } });
    const token = existing?.token || crypto.randomBytes(18).toString("base64url");
    if (!existing) {
      await prisma.sessionRsvp.create({ data: { id: newId("rsvp"), cohortId, learnerId: l.id, sessionDate: date, status: "invited", token, updatedAt: new Date().toISOString() } });
    }
    const mail = classInviteEmail({
      name: l.name, cohortName: cohort.name, dayNumber, dayTitle: day?.title, date, classTime: cohort.classTime,
      confirmUrl: `${origin}/rsvp?t=${token}&a=confirm`,
      declineUrl: `${origin}/rsvp?t=${token}&a=decline`,
    });
    items.push({ to: l.email, subject: mail.subject, body: mail.body, kind: "invite" });
  }
  const { delivered } = await sendBatchEmails(items);
  return { invited: items.length, delivered };
}

// One-click confirm/decline from an email link.
export async function setRsvp(token: string, action: "confirm" | "decline"): Promise<{ ok: boolean; learnerName?: string; cohortName?: string; date?: string; status?: string }> {
  const row = await prisma.sessionRsvp.findUnique({ where: { token } });
  if (!row) return { ok: false };
  const status = action === "confirm" ? "confirmed" : "declined";
  await prisma.sessionRsvp.update({ where: { id: row.id }, data: { status, updatedAt: new Date().toISOString() } });
  const learner = await prisma.learner.findUnique({ where: { id: row.learnerId }, select: { name: true } });
  const cohorts = await listCohorts();
  const cohort = cohorts.find((c) => c.id === row.cohortId);
  return { ok: true, learnerName: learner?.name, cohortName: cohort?.name, date: row.sessionDate, status };
}

// Per-session RSVP counts for the admin UI: date -> {invited, confirmed, declined}.
export async function cohortRsvpMatrix(cohortId: string): Promise<Record<string, RsvpCounts>> {
  const rows = await prisma.sessionRsvp.findMany({ where: { cohortId } });
  const m: Record<string, RsvpCounts> = {};
  for (const r of rows) {
    const c = (m[r.sessionDate] = m[r.sessionDate] || { invited: 0, confirmed: 0, declined: 0 });
    if (r.status === "confirmed") c.confirmed++;
    else if (r.status === "declined") c.declined++;
    else c.invited++;
  }
  return m;
}

// Notify everyone confirmed for this class with the live join link.
export async function notifyClassConfirmed(cohortId: string, date: string, origin: string): Promise<{ notified: number; delivered: number }> {
  const cohorts = await listCohorts();
  const cohort = cohorts.find((c) => c.id === cohortId);
  if (!cohort) return { notified: 0, delivered: 0 };
  const confirmed = await prisma.sessionRsvp.findMany({ where: { cohortId, sessionDate: date, status: "confirmed" } });
  if (!confirmed.length) return { notified: 0, delivered: 0 };
  const learners = await prisma.learner.findMany({ where: { id: { in: confirmed.map((r) => r.learnerId) } }, select: { name: true, email: true } });
  const joinUrl = `${origin}/class/live`;
  const items = learners.map((l) => {
    const mail = classStartingNowEmail({ name: l.name, cohortName: cohort.name, classTime: cohort.classTime, joinUrl });
    return { to: l.email, subject: mail.subject, body: mail.body, kind: "announcement" as const };
  });
  const { delivered } = await sendBatchEmails(items);
  return { notified: items.length, delivered };
}
