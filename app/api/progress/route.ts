import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { mutateDB, readDB } from "@/lib/db";
import { TOTAL_DAYS } from "@/lib/curriculum";

export async function GET() {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ progress: (await readDB()).progress });
}

/**
 * Persists where the class is. Two modes:
 *  - { currentDay, currentSlide }  -> save the live cursor (called as the trainer advances slides)
 *  - { action: "completeDay", day } -> mark a day finished, roll the cursor to the next day
 */
export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json().catch(() => ({}));

  const db = await mutateDB((d) => {
    if (payload.action === "completeDay") {
      const day = Number(payload.day);
      if (day && !d.progress.completedDays.includes(day)) d.progress.completedDays.push(day);
      d.progress.completedDays.sort((a, b) => a - b);
      d.progress.currentDay = Math.min(day + 1, TOTAL_DAYS);
      d.progress.currentSlide = 0;
      // mark matching scheduled session(s) for that day complete
      d.sessions.forEach((s) => {
        if (s.day === day) s.status = "completed";
      });
    } else {
      if (typeof payload.currentDay === "number") d.progress.currentDay = payload.currentDay;
      if (typeof payload.currentSlide === "number") d.progress.currentSlide = payload.currentSlide;
    }
    d.progress.lastTaughtAt = new Date().toISOString();
  });

  return NextResponse.json({ progress: db.progress });
}
