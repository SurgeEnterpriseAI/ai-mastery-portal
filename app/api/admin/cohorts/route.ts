import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { createCohort, updateCohort, deleteCohort, assignLearner, setBatchStatus, getCohort, assignAllUnassigned, listCohortInviteTargets } from "@/lib/cohorts";
import { getLearnerById } from "@/lib/data";
import { sendMail, batchInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // bulk invite sends many emails

function parseDates(v: unknown): string[] {
  const raw = Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(/[\n,]/) : [];
  // Keep only real YYYY-MM-DD dates — downstream (reminders cron, dashboard schedule) relies on this format.
  return raw.map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)));
}

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  // assignment action
  if (b.action === "assign") {
    if (!b.learnerId) return NextResponse.json({ error: "learnerId required" }, { status: 400 });
    await assignLearner(String(b.learnerId), b.cohortId ? String(b.cohortId) : null);
    return NextResponse.json({ ok: true });
  }
  // Bulk: assign every unassigned learner to this cohort
  if (b.action === "assign_all") {
    if (!b.cohortId) return NextResponse.json({ error: "cohortId required" }, { status: 400 });
    const assigned = await assignAllUnassigned(String(b.cohortId));
    return NextResponse.json({ ok: true, assigned });
  }
  // Bulk: send the batch invite to everyone in this cohort who hasn't been invited yet
  if (b.action === "invite_all") {
    if (!b.cohortId) return NextResponse.json({ error: "cohortId required" }, { status: 400 });
    const cohort = await getCohort(String(b.cohortId));
    if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    const targets = (await listCohortInviteTargets(String(b.cohortId))).slice(0, 200);
    const origin = new URL(req.url).origin;
    let invited = 0, delivered = 0;
    for (const l of targets) {
      await setBatchStatus(l.id, "invited");
      const mail = batchInviteEmail({ name: l.name, cohortName: cohort.name, startDate: cohort.startDate, sessionDates: cohort.sessionDates, portalUrl: `${origin}/learn` });
      const r = await sendMail({ to: [l.email], subject: mail.subject, body: mail.body, kind: "invite" });
      invited++; if (r.delivered) delivered++;
    }
    return NextResponse.json({ ok: true, invited, delivered });
  }
  // send batch invite: emails the learner their batch details + sets status "invited"
  if (b.action === "invite") {
    if (!b.learnerId) return NextResponse.json({ error: "learnerId required" }, { status: 400 });
    const learner = await getLearnerById(String(b.learnerId));
    if (!learner) return NextResponse.json({ error: "Learner not found" }, { status: 404 });
    if (!learner.cohortId) return NextResponse.json({ error: "Assign the learner to a cohort first" }, { status: 400 });
    const cohort = await getCohort(learner.cohortId);
    await setBatchStatus(learner.id, "invited");
    const origin = new URL(req.url).origin;
    const mail = batchInviteEmail({
      name: learner.name, cohortName: cohort?.name || "your Tensorpath batch",
      startDate: cohort?.startDate, sessionDates: cohort?.sessionDates || [], portalUrl: `${origin}/learn`,
    });
    const { delivered, via } = await sendMail({ to: [learner.email], subject: mail.subject, body: mail.body, kind: "invite" });
    return NextResponse.json({ ok: true, delivered, via });
  }
  if (!b.name) return NextResponse.json({ error: "Cohort name required" }, { status: 400 });
  const cohort = await createCohort({ name: String(b.name), startDate: b.startDate ? String(b.startDate) : undefined, sessionDates: parseDates(b.sessionDates) });
  return NextResponse.json({ ok: true, cohort });
}

export async function PATCH(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const cohort = await updateCohort(String(b.id), {
    name: b.name, startDate: b.startDate,
    sessionDates: b.sessionDates !== undefined ? parseDates(b.sessionDates) : undefined,
  });
  return NextResponse.json({ ok: true, cohort });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await deleteCohort(id);
  return NextResponse.json({ ok: true });
}
