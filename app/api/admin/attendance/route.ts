import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { markAttendance } from "@/lib/cohorts";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { cohortId, learnerId, sessionDate, present } = await req.json().catch(() => ({}));
  if (!cohortId || !learnerId || !sessionDate) {
    return NextResponse.json({ error: "cohortId, learnerId and sessionDate required" }, { status: 400 });
  }
  await markAttendance(String(cohortId), String(learnerId), String(sessionDate), Boolean(present));
  return NextResponse.json({ ok: true });
}
