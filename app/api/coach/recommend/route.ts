import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { getCurrentLearner, pushJourney, ensureProfileEmbedding } from "@/lib/learner";
import { recommendNext } from "@/lib/claude";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel: 60s Hobby ceiling; adaptive-thinking recommend can run ~20s

export async function POST() {
  let learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await rateLimit(`recommend:${learner.id}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ error: `Too many requests. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  learner = await ensureProfileEmbedding(learner);
  const { progress } = await readDB();
  const text = await recommendNext(learner, progress.currentDay, progress.completedDays);
  await pushJourney(learner.id, { type: "recommendation", summary: "Got a personalised next-step recommendation" });
  return NextResponse.json({ ok: true, recommendation: text });
}
