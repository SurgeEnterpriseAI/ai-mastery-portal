import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { getCurrentLearner, pushJourney, ensureProfileEmbedding } from "@/lib/learner";
import { recommendNext } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel: 60s Hobby ceiling; adaptive-thinking recommend can run ~20s

export async function POST() {
  let learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  learner = await ensureProfileEmbedding(learner);
  const { progress } = await readDB();
  const text = await recommendNext(learner, progress.currentDay, progress.completedDays);
  await pushJourney(learner.id, { type: "recommendation", summary: "Got a personalised next-step recommendation" });
  return NextResponse.json({ ok: true, recommendation: text });
}
