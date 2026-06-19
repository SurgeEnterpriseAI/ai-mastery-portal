import { NextResponse } from "next/server";
import { getCurrentLearner, pushJourney } from "@/lib/learner";
import { setBatchStatus } from "@/lib/cohorts";

export const dynamic = "force-dynamic";

// Learner confirms or declines their batch seat.
export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = await req.json().catch(() => ({}));
  if (action !== "confirm" && action !== "decline") {
    return NextResponse.json({ error: "action must be confirm or decline" }, { status: 400 });
  }
  const status = action === "confirm" ? "confirmed" : "declined";
  await setBatchStatus(learner.id, status);
  await pushJourney(learner.id, { type: "recommendation", summary: action === "confirm" ? "Confirmed batch seat" : "Declined batch seat" });
  return NextResponse.json({ ok: true, status });
}
