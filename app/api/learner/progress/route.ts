import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { completeLearnerDay } from "@/lib/data";
import { getDay, TOTAL_DAYS } from "@/lib/curriculum";

export async function POST(req: Request) {
  const id = getSessionLearnerId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { day, done } = await req.json().catch(() => ({}));
  const dayNum = Number(day);
  if (!dayNum || dayNum < 1 || dayNum > TOTAL_DAYS) return NextResponse.json({ error: "Invalid day" }, { status: 400 });

  const title = getDay(dayNum)?.title || `Day ${dayNum}`;
  const completedDays = await completeLearnerDay(id, dayNum, Boolean(done), title);
  return NextResponse.json({ ok: true, completedDays, total: TOTAL_DAYS });
}
