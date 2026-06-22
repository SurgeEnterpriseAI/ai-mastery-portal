import { prisma, newId, getLearnerByEmail, getAppState } from "./data";
import { listCohorts, markAttendance } from "./cohorts";
import { getDay } from "./curriculum";
import { sendBatchEmails, classRecapEmail } from "./email";

export function istDate(tsIso?: string): string {
  const d = tsIso ? new Date(tsIso) : new Date();
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD in IST
}

function arr<T>(v: string | null | undefined): T[] {
  try { const x = JSON.parse(v || "[]"); return Array.isArray(x) ? x : []; } catch { return []; }
}

// The cohort whose schedule includes `date` (IST today by default), else the most recent cohort.
export async function activeCohort(date = istDate()): Promise<{ id: string; name: string } | null> {
  const cohorts = await listCohorts();
  const onDate = cohorts.find((c) => c.sessionDates.includes(date));
  const c = onDate || cohorts[0];
  return c ? { id: c.id, name: c.name } : null;
}

// Record a join (from a JaaS PARTICIPANT_JOINED webhook): mark the learner present.
export async function recordJoinByEmail(email: string, tsIso?: string): Promise<boolean> {
  if (!email) return false;
  const learner = await getLearnerByEmail(email.trim().toLowerCase());
  if (!learner) return false;
  const date = istDate(tsIso);
  const cohort = await activeCohort(date);
  if (!cohort) return false;
  await markAttendance(cohort.id, learner.id, date, true);
  return true;
}

export async function presentLearners(cohortId: string, date: string): Promise<Array<{ id: string; name: string; email: string }>> {
  const rows = await prisma.attendance.findMany({ where: { cohortId, sessionDate: date, present: true } });
  const ids = rows.map((r) => r.learnerId);
  if (!ids.length) return [];
  const ls = await prisma.learner.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
  return ls;
}

export async function setRecapRecording(cohortId: string, date: string, recordingUrl: string): Promise<void> {
  await prisma.classRecap.upsert({
    where: { cohortId_date: { cohortId, date } },
    update: { recordingUrl },
    create: { id: newId("rcp"), cohortId, date, recordingUrl },
  });
}

/**
 * Build a recap from the day's curriculum and email it to everyone who attended.
 * Idempotent per cohort+date (won't re-send) unless force=true.
 */
export async function sendCohortRecap(cohortId: string, date: string, origin: string, opts?: { force?: boolean }): Promise<{ sent: boolean; recipients: number; reason?: string }> {
  const existing = await prisma.classRecap.findUnique({ where: { cohortId_date: { cohortId, date } } });
  if (existing?.sentAt && !opts?.force) return { sent: false, recipients: 0, reason: "already sent" };

  const present = await presentLearners(cohortId, date);
  if (present.length === 0) return { sent: false, recipients: 0, reason: "no attendees recorded" };

  const cohorts = await listCohorts();
  const cohort = cohorts.find((c) => c.id === cohortId);
  const { progress } = await getAppState();
  const dayNum = progress.currentDay;
  const day = getDay(dayNum);
  const portalUrl = `${origin}/learn`;
  const recordingUrl = existing?.recordingUrl || undefined;

  const items = present.map((l) => {
    const mail = classRecapEmail({
      name: l.name,
      cohortName: cohort?.name || "your Tensorpath batch",
      dayNumber: dayNum,
      dayTitle: day?.title || `Day ${dayNum}`,
      takeaways: (day?.keyTakeaways || []).slice(0, 6),
      homework: day?.homework,
      nextTeaser: day?.nextDayTeaser,
      recordingUrl,
      portalUrl,
    });
    return { to: l.email, subject: mail.subject, body: mail.body, kind: "announcement" as const };
  });

  const { delivered } = await sendBatchEmails(items);
  await prisma.classRecap.upsert({
    where: { cohortId_date: { cohortId, date } },
    update: { sentAt: new Date().toISOString(), recipients: items.length, dayNumber: dayNum },
    create: { id: newId("rcp"), cohortId, date, sentAt: new Date().toISOString(), recipients: items.length, dayNumber: dayNum, recordingUrl },
  });
  return { sent: true, recipients: items.length, reason: `${delivered} delivered` };
}
