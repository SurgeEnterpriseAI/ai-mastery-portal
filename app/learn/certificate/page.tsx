import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentLearner } from "@/lib/learner";
import { getCertificateForLearner } from "@/lib/data";
import { getCapstone } from "@/lib/capstone";
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

  // capstone review gate (Module C)
  const cap = await getCapstone(learner.id);
  if (cap && (cap.status === "submitted" || cap.status === "under_review")) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/learn" className="text-sm text-slate-500 hover:text-slate-900">← Back to dashboard</Link>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="text-4xl">⏳</div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Capstone under review</h1>
          <p className="mt-2 text-slate-600">
            Your trainer is reviewing <strong>&ldquo;{cap.title}&rdquo;</strong>. Once approved, your certificate is issued
            automatically and will appear here. You&rsquo;ll be emailed when it&rsquo;s ready.
          </p>
        </div>
      </main>
    );
  }
  // not yet submitted, or revisions requested → (re)submission form with feedback
  return (
    <CapstoneForm
      totalDays={TOTAL_DAYS}
      initial={cap ? { title: cap.title, description: cap.description, links: cap.links, fileUrl: cap.fileUrl } : undefined}
      feedback={cap?.status === "revisions" ? cap.comments : undefined}
    />
  );
}
