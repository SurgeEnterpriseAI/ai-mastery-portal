import { redirect } from "next/navigation";
import { getCurrentLearner, gateStatus } from "@/lib/learner";
import { readDB } from "@/lib/db";
import { TOTAL_DAYS } from "@/lib/curriculum";
import { hasClaudeKey } from "@/lib/claude";
import { isRazorpayConfigured, PRO_PRICE_PAISE, CURRENCY } from "@/lib/payments";
import LearnDashboard from "./LearnDashboard";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/signin");
  const db = await readDB();
  const gate = gateStatus(learner);
  const mySessions = db.coachSessions
    .filter((s) => s.learnerId === learner.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((s) => ({ id: s.id, title: s.title, updatedAt: s.updatedAt, count: s.messages.length }));
  const myTickets = db.tickets
    .filter((t) => t.learnerId === learner.id)
    .map((t) => ({ id: t.id, question: t.question, status: t.status, response: t.response, createdAt: t.createdAt }));

  return (
    <LearnDashboard
      initial={{
        learner: {
          name: learner.name,
          email: learner.email,
          background: learner.background,
          goals: learner.goals,
          level: learner.level,
          paid: learner.paid,
          plan: learner.plan,
          journey: learner.journey.slice(-15).reverse(),
        },
        gate: { locked: gate.locked, used: gate.used, limit: gate.limit, remaining: gate.remaining === Infinity ? null : gate.remaining },
        progress: { currentDay: db.progress.currentDay, completedDays: db.progress.completedDays },
        totalDays: TOTAL_DAYS,
        cohortName: db.cohortName,
        sessions: mySessions,
        tickets: myTickets,
        claudeConfigured: hasClaudeKey(),
        payConfigured: isRazorpayConfigured(),
        price: PRO_PRICE_PAISE,
        currency: CURRENCY,
      }}
    />
  );
}
