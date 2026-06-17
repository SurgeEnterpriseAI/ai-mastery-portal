import { NextResponse } from "next/server";
import { newId, getCoachSession, createTicket, getTrainer } from "@/lib/data";
import { getCurrentLearner, pushJourney } from "@/lib/learner";
import { sendMail, helpRequestEmail } from "@/lib/email";

export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { coachSessionId, question } = await req.json().catch(() => ({}));
  if (!question || !String(question).trim()) {
    return NextResponse.json({ error: "Please describe what you'd like help with" }, { status: 400 });
  }

  // pull a short context from the related coaching session, if any
  let context = "(no coaching session attached)";
  if (coachSessionId) {
    const cs = await getCoachSession(coachSessionId, learner.id);
    if (cs) {
      context = cs.messages
        .slice(-4)
        .map((m) => `${m.role === "user" ? learner.name : "Coach"}: ${m.content.slice(0, 300)}`)
        .join("\n");
    }
  }

  const q = String(question).trim();
  await createTicket({
    id: newId("tkt"),
    learnerId: learner.id,
    learnerName: learner.name,
    learnerEmail: learner.email,
    coachSessionId: coachSessionId || undefined,
    question: q,
    context,
    createdAt: new Date().toISOString(),
  });
  await pushJourney(learner.id, { type: "help_request", summary: `Requested human help: ${q.slice(0, 80)}` });

  const trainer = await getTrainer();
  const portalUrl = `${new URL(req.url).origin}/trainer`;
  const { subject, body } = helpRequestEmail({
    trainerEmail: trainer.email,
    learnerName: learner.name,
    learnerEmail: learner.email,
    question: q,
    context,
    portalUrl,
  });
  const { delivered } = await sendMail({ to: [trainer.email], subject, body, kind: "help" });

  return NextResponse.json({
    ok: true,
    message: delivered
      ? "A human trainer has been notified and will reach out by email."
      : "Your request was logged. A trainer will see it on their console (configure email to notify them instantly).",
  });
}
