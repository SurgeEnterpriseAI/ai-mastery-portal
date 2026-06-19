import { prisma, newId, leadStats } from "./data";
import { placementStats } from "./careers";
import type { Cohort } from "./types";

function arr<T>(v: string | null | undefined): T[] {
  try { const x = JSON.parse(v || "[]"); return Array.isArray(x) ? x : []; } catch { return []; }
}
function mapCohort(c: any): Cohort {
  return { id: c.id, name: c.name, startDate: c.startDate ?? undefined, sessionDates: arr<string>(c.sessionDates), trainerId: c.trainerId ?? undefined, createdAt: c.createdAt };
}

export async function listCohorts(): Promise<Cohort[]> {
  return (await prisma.cohort.findMany({ orderBy: { createdAt: "desc" } })).map(mapCohort);
}
export async function getCohort(id: string): Promise<Cohort | null> {
  const c = await prisma.cohort.findUnique({ where: { id } });
  return c ? mapCohort(c) : null;
}
export async function createCohort(input: { name: string; startDate?: string; sessionDates?: string[] }): Promise<Cohort> {
  const c = await prisma.cohort.create({
    data: { id: newId("coh"), name: input.name, startDate: input.startDate || null, sessionDates: JSON.stringify(input.sessionDates || []), createdAt: new Date().toISOString() },
  });
  return mapCohort(c);
}
export async function updateCohort(id: string, input: { name?: string; startDate?: string; sessionDates?: string[] }): Promise<Cohort | null> {
  try {
    const c = await prisma.cohort.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.sessionDates !== undefined ? { sessionDates: JSON.stringify(input.sessionDates) } : {}),
      },
    });
    return mapCohort(c);
  } catch { return null; }
}
export async function deleteCohort(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.learner.updateMany({ where: { cohortId: id }, data: { cohortId: null } }),
    prisma.attendance.deleteMany({ where: { cohortId: id } }),
    prisma.cohort.deleteMany({ where: { id } }),
  ]);
}
export async function assignLearner(learnerId: string, cohortId: string | null): Promise<void> {
  await prisma.learner.update({ where: { id: learnerId }, data: { cohortId } });
}

// Roster + a roster's learners (basic fields).
export async function cohortRoster(cohortId: string): Promise<Array<{ id: string; name: string; email: string }>> {
  const ls = await prisma.learner.findMany({ where: { cohortId }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } });
  return ls;
}
// All learners with their current cohort assignment (for the admin roster UI).
export async function listLearnersForCohorts(): Promise<Array<{ id: string; name: string; email: string; cohortId: string | null; batchStatus: string | null }>> {
  return prisma.learner.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, cohortId: true, batchStatus: true } });
}

// Set a learner's batch-seat confirmation status (invited | confirmed | declined).
export async function setBatchStatus(learnerId: string, status: "invited" | "confirmed" | "declined"): Promise<void> {
  await prisma.learner.update({ where: { id: learnerId }, data: { batchStatus: status } });
}

// The learner's batch (cohort) details + their confirmation status, for the dashboard.
export async function getLearnerBatch(learnerId: string): Promise<{ status: string | null; cohort: Cohort | null }> {
  const l = await prisma.learner.findUnique({ where: { id: learnerId }, select: { batchStatus: true, cohortId: true } });
  if (!l) return { status: null, cohort: null };
  const cohort = l.cohortId ? await getCohort(l.cohortId) : null;
  return { status: l.batchStatus ?? null, cohort };
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export async function getAttendance(cohortId: string): Promise<Record<string, boolean>> {
  // key = `${learnerId}|${sessionDate}` → present
  const rows = await prisma.attendance.findMany({ where: { cohortId } });
  const map: Record<string, boolean> = {};
  for (const r of rows) map[`${r.learnerId}|${r.sessionDate}`] = r.present;
  return map;
}
export async function markAttendance(cohortId: string, learnerId: string, sessionDate: string, present: boolean): Promise<void> {
  await prisma.attendance.upsert({
    where: { cohortId_learnerId_sessionDate: { cohortId, learnerId, sessionDate } },
    update: { present },
    create: { id: newId("att"), cohortId, learnerId, sessionDate, present },
  });
}

// ---------------------------------------------------------------------------
// Admin funnel dashboard (lead → placement)
// ---------------------------------------------------------------------------
export async function funnelMetrics() {
  const [leads, learners, completed, certs, openOpenings, placement] = await Promise.all([
    leadStats(),
    prisma.learner.count(),
    prisma.learner.findMany({ select: { completedDays: true } }),
    prisma.certificate.count({ where: { status: "valid" } }),
    prisma.opening.count({ where: { status: "open" } }),
    placementStats(),
  ]);
  const completedAll = completed.filter((l) => arr<number>(l.completedDays).length >= 20).length;
  const completionPct = learners > 0 ? Math.round((completedAll / learners) * 100) : 0;
  return {
    leads,
    enrolled: learners,
    completedAll,
    completionPct,
    certified: certs,
    openOpenings,
    placed: placement.placed,
    placementReady: placement.placementReady,
    placedPct: placement.placedPct,
  };
}
