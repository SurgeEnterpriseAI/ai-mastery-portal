import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { mutateDB } from "@/lib/db";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { cohortName, startDate } = await req.json().catch(() => ({}));
  const db = await mutateDB((d) => {
    if (typeof cohortName === "string" && cohortName.trim()) d.cohortName = cohortName.trim();
    if (typeof startDate === "string") d.startDate = startDate || null;
  });
  return NextResponse.json({ ok: true, cohortName: db.cohortName, startDate: db.startDate });
}
