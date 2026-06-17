import { NextResponse } from "next/server";
import { mutateDB, readDB, newId } from "@/lib/db";
import { getCurrentLearner, pushJourney } from "@/lib/learner";
import { sendMail, helpRequestEmail } from "@/lib/email";
import type { HelpTicket } from "@/lib/types";

export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { coachSessionId, question } = await req.json().catch(() => ({}));
  if (!question || !String(question).trim()) {
    return NextResponse.json({ error: "Please describe what you'd like help with" }, { status: 400 });
  }

  const db = await readDB();
  // pull a short context from the related coaching session, if any
  let context = "(no coaching session attached)";
  const cs = db.coachSessions.find((s) => s.id === coachSessionId && s.learnerId === learner.id);
  if (cs) {
    context = cs.messages
      .slice(-4)
      .map((m) => `${m.role === "user" ? learner.name : "Coach"}: ${m.content.slice(0, 300)}`)
      .join("\n");
  }

  const ticket: HelpTicket = {
    id: newId("tkt"),
    learnerId: learner.id,
    learnerName: learner.name,
    learnerEmail: learner.email,
    coachSessionId: coachSessionId || undefined,
    question: String(question).trim(),
    context,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  await mutateDB((d) => d.tickets.unshift(ticket));
  await pushJourney(learner.id, { type: "help_request", summary: `Requested human help: ${ticket.question.slice(0, 80)}` });

  const portalUrl = `${new URL(req.url).origin}/trainer`;
  const { subject, body } = helpRequestEmail({
    trainerEmail: db.trainer.email,
    learnerName: learner.name,
    learnerEmail: learner.email,
    question: ticket.question,
    context,
    portalUrl,
  });
  const { delivered } = await sendMail({ to: [db.trainer.email], subject, body, kind: "help" });

  return NextResponse.json({
    ok: true,
    message: delivered
      ? "A human trainer has been notified and will reach out by email."
      : "Your request was logged. A trainer will see it on their console (configure email to notify them instantly).",
  });
}
