import { redirect } from "next/navigation";
import { getCurrentLearner } from "@/lib/learner";
import { readDB } from "@/lib/db";
import { TOTAL_DAYS } from "@/lib/curriculum";
import Certificate from "./Certificate";

export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/signin");
  if ((learner.completedDays?.length || 0) < TOTAL_DAYS) redirect("/learn");
  const db = await readDB();
  const issued = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return <Certificate name={learner.name} cohort={db.cohortName} issued={issued} days={TOTAL_DAYS} />;
}
