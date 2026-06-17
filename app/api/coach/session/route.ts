import { NextResponse } from "next/server";
import { getSessionLearnerId } from "@/lib/auth";
import { getCurrentLearner, gateStatus } from "@/lib/learner";
import { listCoachSessionMeta, createCoachSessionTx } from "@/lib/data";
import { PRO_PRICE_PAISE, CURRENCY } from "@/lib/payments";

export async function GET() {
  const id = getSessionLearnerId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ sessions: await listCoachSessionMeta(id) });
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
  const sessionTitle = (title && String(title).slice(0, 80)) || `Coaching session ${learner.handholdingCount + 1}`;
  const sessionId = await createCoachSessionTx(learner.id, sessionTitle);

  const after = gateStatus({ ...learner, handholdingCount: learner.handholdingCount + 1 });
  return NextResponse.json({ ok: true, sessionId, remaining: after.remaining === Infinity ? null : after.remaining });
}
