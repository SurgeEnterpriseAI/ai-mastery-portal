import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { getAllDayMeta, availableDayCount, TOTAL_DAYS } from "@/lib/curriculum";
import TrainerDashboard from "./TrainerDashboard";

export const dynamic = "force-dynamic";

export default async function TrainerPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const db = await readDB();
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  );

  return (
    <TrainerDashboard
      initial={{
        cohortName: db.cohortName,
        startDate: db.startDate,
        trainees: db.trainees,
        sessions: db.sessions,
        progress: db.progress,
        outbox: db.outbox.slice(0, 12),
        dayMetas: getAllDayMeta(),
        daysReady: availableDayCount(),
        totalDays: TOTAL_DAYS,
        smtpConfigured: emailConfigured,
        learners: db.learners.map((l) => ({
          id: l.id, name: l.name, email: l.email, plan: l.plan, paid: l.paid,
          handholdingCount: l.handholdingCount, goals: l.goals, createdAt: l.createdAt,
        })),
        tickets: db.tickets.map((t) => ({
          id: t.id, learnerName: t.learnerName, learnerEmail: t.learnerEmail,
          question: t.question, context: t.context, status: t.status, response: t.response, createdAt: t.createdAt,
        })),
        payments: db.payments.map((p) => ({
          id: p.id, amount: p.amount, currency: p.currency, status: p.status, provider: p.provider, createdAt: p.createdAt,
        })),
      }}
    />
  );
}
