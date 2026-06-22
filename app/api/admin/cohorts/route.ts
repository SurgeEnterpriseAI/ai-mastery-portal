import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { createCohort, updateCohort, deleteCohort, assignLearner, setBatchStatus, getCohort, assignAllUnassigned, listCohortInviteTargets, cohortRoster, listConfirmedLearners } from "@/lib/cohorts";
import { getLearnerById } from "@/lib/data";
import { sendMail, batchInviteEmail, sendBatchEmails, classStartingNowEmail } from "@/lib/email";
import { sendCohortRecap, istDate } from "@/lib/class-recap";

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
  // Bulk: send the batch invite. By default only those not yet invited; with all:true, re-send to the whole roster (e.g. after setting the class time).
  if (b.action === "invite_all") {
    if (!b.cohortId) return NextResponse.json({ error: "cohortId required" }, { status: 400 });
    const cohort = await getCohort(String(b.cohortId));
    if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    const pool = b.all ? await cohortRoster(String(b.cohortId)) : await listCohortInviteTargets(String(b.cohortId));
    const targets = pool.slice(0, 200);
    const origin = new URL(req.url).origin;
    const items = targets.map((l) => {
      const mail = batchInviteEmail({ name: l.name, cohortName: cohort.name, startDate: cohort.startDate, classTime: cohort.classTime, sessionDates: cohort.sessionDates, portalUrl: `${origin}/learn` });
      return { to: l.email, subject: mail.subject, body: mail.body, kind: "invite" as const };
    });
    for (const l of targets) await setBatchStatus(l.id, "invited");
    const { delivered } = await sendBatchEmails(items); // one Resend batch call — no rate-limit burst
    return NextResponse.json({ ok: true, invited: items.length, delivered });
  }
  // Email the class recap (curriculum notes + recording link) to everyone who attended.
  if (b.action === "send_recap") {
    if (!b.cohortId) return NextResponse.json({ error: "cohortId required" }, { status: 400 });
    const date = b.date ? String(b.date) : istDate();
    const r = await sendCohortRecap(String(b.cohortId), date, new URL(req.url).origin, { force: true });
    return NextResponse.json({ ok: true, ...r, date });
  }
  // Notify confirmed learners that class is starting NOW (on-demand, with the join link)
  if (b.action === "notify_now") {
    if (!b.cohortId) return NextResponse.json({ error: "cohortId required" }, { status: 400 });
    const cohort = await getCohort(String(b.cohortId));
    if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    const confirmed = await listConfirmedLearners(String(b.cohortId));
    if (confirmed.length === 0) return NextResponse.json({ ok: true, notified: 0, delivered: 0 });
    const joinUrl = `${new URL(req.url).origin}/class/live`;
    const items = confirmed.map((l) => {
      const mail = classStartingNowEmail({ name: l.name, cohortName: cohort.name, classTime: cohort.classTime, joinUrl });
      return { to: l.email, subject: mail.subject, body: mail.body, kind: "announcement" as const };
    });
    const { delivered } = await sendBatchEmails(items);
    return NextResponse.json({ ok: true, notified: items.length, delivered });
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
      startDate: cohort?.startDate, classTime: cohort?.classTime, sessionDates: cohort?.sessionDates || [], portalUrl: `${origin}/learn`,
    });
    const { delivered, via } = await sendMail({ to: [learner.email], subject: mail.subject, body: mail.body, kind: "invite" });
    return NextResponse.json({ ok: true, delivered, via });
  }
  if (!b.name) return NextResponse.json({ error: "Cohort name required" }, { status: 400 });
  const cohort = await createCohort({ name: String(b.name), startDate: b.startDate ? String(b.startDate) : undefined, classTime: b.classTime ? String(b.classTime) : undefined, sessionDates: parseDates(b.sessionDates) });
  return NextResponse.json({ ok: true, cohort });
}

export async function PATCH(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const cohort = await updateCohort(String(b.id), {
    name: b.name, startDate: b.startDate, classTime: b.classTime,
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
