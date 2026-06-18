import { NextResponse } from "next/server";
import { getCurrentLearner, pushJourney } from "@/lib/learner";
import { getAppState, getCertificateForLearner, issueCertificate } from "@/lib/data";
import { getCapstone } from "@/lib/capstone";
import { polishCapstone } from "@/lib/claude";
import { rateLimit } from "@/lib/ratelimit";
import { TOTAL_DAYS } from "@/lib/curriculum";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Certification is gated on an APPROVED capstone (Module C). Approval normally
// auto-issues the certificate; this endpoint is the idempotent "claim" path.
export async function POST() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getCertificateForLearner(learner.id);
  if (existing) return NextResponse.json({ ok: true, credentialId: existing.credentialId, already: true });

  if ((learner.completedDays?.length || 0) < TOTAL_DAYS) {
    return NextResponse.json({ error: `Complete all ${TOTAL_DAYS} days first.` }, { status: 400 });
  }

  const cap = await getCapstone(learner.id);
  if (!cap || cap.status !== "approved") {
    return NextResponse.json({ error: "Your capstone must be approved by a trainer before the certificate can be issued." }, { status: 403 });
  }

  const rl = await rateLimit(`cert:${learner.id}`, 5, 3600);
  if (!rl.ok) return NextResponse.json({ error: `Please wait ${rl.retryAfter}s and try again.` }, { status: 429 });

  const summary = await polishCapstone(learner, cap.title, cap.description);
  const { cohortName } = await getAppState();
  const cert = await issueCertificate({
    learnerId: learner.id, learnerName: learner.name, learnerEmail: learner.email,
    cohort: cohortName, daysCompleted: learner.completedDays.length,
    capstoneTitle: cap.title, capstoneSummary: summary, capstoneRaw: cap.description,
  });
  await pushJourney(learner.id, { type: "recommendation", summary: `Earned certificate ${cert.credentialId} — capstone: ${cap.title}` });

  return NextResponse.json({ ok: true, credentialId: cert.credentialId });
}
