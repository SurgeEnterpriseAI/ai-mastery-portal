import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { createCohort, updateCohort, deleteCohort, assignLearner } from "@/lib/cohorts";

function parseDates(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  return [];
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
  const id = new URL(req.url).searchParams.get("id") || "";
  await deleteCohort(id);
  return NextResponse.json({ ok: true });
}
