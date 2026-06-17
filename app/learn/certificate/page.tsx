import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentLearner } from "@/lib/learner";
import { getCertificateForLearner } from "@/lib/data";
import { TOTAL_DAYS } from "@/lib/curriculum";
import Certificate from "./Certificate";
import CapstoneForm from "./CapstoneForm";

export const dynamic = "force-dynamic";

function origin() {
  const h = headers();
  return `${h.get("x-forwarded-proto") || "http"}://${h.get("host") || "localhost:4321"}`;
}

export default async function CertificatePage() {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/signin");

  const cert = await getCertificateForLearner(learner.id);
  if (cert) {
    return (
      <Certificate
        name={cert.learnerName}
        cohort={cert.cohort}
        issued={new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        days={cert.daysCompleted}
        credentialId={cert.credentialId}
        verifyUrl={`${origin()}/verify/${cert.credentialId}`}
        capstoneTitle={cert.capstoneTitle}
        capstoneSummary={cert.capstoneSummary}
        status={cert.status}
      />
    );
  }

  if ((learner.completedDays?.length || 0) < TOTAL_DAYS) redirect("/learn");
  return <CapstoneForm totalDays={TOTAL_DAYS} />;
}
