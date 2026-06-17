import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { updateCohort } from "@/lib/data";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { cohortName, startDate } = await req.json().catch(() => ({}));
  const res = await updateCohort({ cohortName, startDate });
  return NextResponse.json({ ok: true, ...res });
}
