import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { getTrainerSnapshot } from "@/lib/data";
import { getAllDayMeta, availableDayCount, TOTAL_DAYS } from "@/lib/curriculum";
import TrainerDashboard from "./TrainerDashboard";

export const dynamic = "force-dynamic";

export default async function TrainerPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const snap = await getTrainerSnapshot();
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  );

  return (
    <TrainerDashboard
      initial={{
        cohortName: snap.cohortName,
        startDate: snap.startDate,
        trainees: snap.trainees,
        sessions: snap.sessions,
        progress: snap.progress,
        outbox: snap.outbox,
        dayMetas: getAllDayMeta(),
        daysReady: availableDayCount(),
        totalDays: TOTAL_DAYS,
        smtpConfigured: emailConfigured,
        learners: snap.learners,
        tickets: snap.tickets.map((t) => ({
          id: t.id, learnerName: t.learnerName, learnerEmail: t.learnerEmail,
          question: t.question, context: t.context, status: t.status, response: t.response, createdAt: t.createdAt,
        })),
        payments: snap.payments,
        certificates: snap.certificates,
      }}
    />
  );
}
