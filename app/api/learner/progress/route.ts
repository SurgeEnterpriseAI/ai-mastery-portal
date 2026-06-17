import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { mutateDB, newId } from "@/lib/db";
import { getDay, TOTAL_DAYS } from "@/lib/curriculum";

export async function POST(req: Request) {
  const id = getSessionLearnerId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { day, done } = await req.json().catch(() => ({}));
  const dayNum = Number(day);
  if (!dayNum || dayNum < 1 || dayNum > TOTAL_DAYS) return NextResponse.json({ error: "Invalid day" }, { status: 400 });

  const db = await mutateDB((d) => {
    const l = d.learners.find((x) => x.id === id);
    if (!l) return;
    l.completedDays ||= [];
    const has = l.completedDays.includes(dayNum);
    if (done && !has) {
      l.completedDays.push(dayNum);
      l.completedDays.sort((a, b) => a - b);
      const title = getDay(dayNum)?.title || `Day ${dayNum}`;
      l.journey.push({ id: newId("jrn"), type: "day_completed", day: dayNum, summary: `Completed Day ${dayNum}: ${title}`, at: new Date().toISOString() });
    } else if (!done && has) {
      l.completedDays = l.completedDays.filter((x) => x !== dayNum);
    }
  });
  const l = db.learners.find((x) => x.id === id);
  return NextResponse.json({ ok: true, completedDays: l?.completedDays || [], total: TOTAL_DAYS });
}
