import { NextResponse } from "next/server";
import { listCohorts, getAttendance, cohortRoster } from "@/lib/cohorts";

export const dynamic = "force-dynamic";

// TEMPORARY token-guarded attendance/cohort capture report. Removed after use.
const TOKEN = "tp-att-4b9c";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const cohorts = await listCohorts();
  const out = [];
  for (const c of cohorts) {
    const roster = await cohortRoster(c.id);
    const att = await getAttendance(c.id); // "learnerId|date" -> present
    const marks = Object.entries(att).filter(([, p]) => p);
    const perDate: Record<string, number> = {};
    for (const [k, present] of Object.entries(att)) {
      if (!present) continue;
      const date = k.split("|")[1];
      perDate[date] = (perDate[date] || 0) + 1;
    }
    out.push({
      cohort: c.name,
      classTime: c.classTime || null,
      sessions: c.sessionDates.length,
      firstSession: c.sessionDates[0] || null,
      learners: roster.length,
      attendanceMarkedTotal: marks.length,
      presentPerDate: perDate,
    });
  }
  return NextResponse.json({ cohorts: out });
}
