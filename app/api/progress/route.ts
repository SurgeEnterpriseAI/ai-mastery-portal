import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { getAppState, setProgress, completeCohortDay } from "@/lib/data";
import { TOTAL_DAYS } from "@/lib/curriculum";

export async function GET() {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ progress: (await getAppState()).progress });
}

/**
 * Persists where the class is. Two modes:
 *  - { currentDay, currentSlide }    -> save the live cursor as the trainer advances
 *  - { action: "completeDay", day }  -> mark a day done, roll the cursor to the next day
 */
export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json().catch(() => ({}));

  let progress;
  if (payload.action === "completeDay" && Number(payload.day)) {
    progress = await completeCohortDay(Number(payload.day), TOTAL_DAYS);
  } else {
    progress = await setProgress({
      currentDay: typeof payload.currentDay === "number" ? payload.currentDay : undefined,
      currentSlide: typeof payload.currentSlide === "number" ? payload.currentSlide : undefined,
    });
  }
  return NextResponse.json({ progress });
}
