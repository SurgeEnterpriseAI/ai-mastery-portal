import { NextResponse } from "next/server";
import { mutateDB, readDB, newId } from "@/lib/db";
import { getSessionLearnerId } from "@/lib/auth";
import { getCurrentLearner, gateStatus } from "@/lib/learner";
import { PRO_PRICE_PAISE, CURRENCY } from "@/lib/payments";
import type { CoachSession } from "@/lib/types";

export async function GET() {
  const id = getSessionLearnerId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = (await readDB())
    .coachSessions.filter((s) => s.learnerId === id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = gateStatus(learner);
  if (gate.locked) {
    return NextResponse.json(
      {
        error: "paywall",
        message: `You've used all ${gate.limit} free coaching sessions. Unlock unlimited coaching to continue.`,
        price: PRO_PRICE_PAISE,
        currency: CURRENCY,
      },
      { status: 402 },
    );
  }

  const { title } = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const session: CoachSession = {
    id: newId("cs"),
    learnerId: learner.id,
    title: (title && String(title).slice(0, 80)) || `Coaching session ${learner.handholdingCount + 1}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await mutateDB((db) => {
    const l = db.learners.find((x) => x.id === learner.id);
    if (l) {
      l.handholdingCount += 1;
      l.journey.push({ id: newId("jrn"), type: "coach_session", summary: `Started ${session.title}`, at: now });
    }
    db.coachSessions.push(session);
  });

  const after = gateStatus({ ...learner, handholdingCount: learner.handholdingCount + 1 });
  return NextResponse.json({
    ok: true,
    sessionId: session.id,
    remaining: after.remaining === Infinity ? null : after.remaining,
  });
}
