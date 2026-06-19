import { redirect } from "next/navigation";
import { getCurrentLearner, gateStatus } from "@/lib/learner";
import { getAppState, listCoachSessionMeta, listTicketsForLearner } from "@/lib/data";
import { getLearnerBatch } from "@/lib/cohorts";
import { TOTAL_DAYS, getAllDayMeta } from "@/lib/curriculum";
import { hasClaudeKey } from "@/lib/claude";
import { isRazorpayConfigured, PRO_PRICE_PAISE, CURRENCY } from "@/lib/payments";
import LearnDashboard from "./LearnDashboard";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/signin");
  const [{ cohortName, progress }, mySessions, ticketRows, batch] = await Promise.all([
    getAppState(),
    listCoachSessionMeta(learner.id),
    listTicketsForLearner(learner.id),
    getLearnerBatch(learner.id),
  ]);
  const gate = gateStatus(learner);
  const myTickets = ticketRows.map((t) => ({ id: t.id, question: t.question, status: t.status, response: t.response, createdAt: t.createdAt }));

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
          completedDays: learner.completedDays || [],
          journey: learner.journey.slice(-15).reverse(),
        },
        dayMetas: getAllDayMeta(),
        gate: { locked: gate.locked, used: gate.used, limit: gate.limit, remaining: gate.remaining === Infinity ? null : gate.remaining },
        progress: { currentDay: progress.currentDay, completedDays: progress.completedDays },
        totalDays: TOTAL_DAYS,
        cohortName,
        batch: { status: batch.status, cohortName: batch.cohort?.name || null, startDate: batch.cohort?.startDate || null, sessions: batch.cohort?.sessionDates.length || 0 },
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
