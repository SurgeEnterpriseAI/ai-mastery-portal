import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { reviewCapstone, getCapstone } from "@/lib/capstone";
import { getAppState, getCertificateForLearner, issueCertificate, getLearnerById } from "@/lib/data";
import { polishCapstone } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STATUSES = ["submitted", "under_review", "approved", "revisions"];

// Trainer reviews a capstone. On "approved", the certificate is issued automatically.
export async function PATCH(req: Request) {
  const trainerId = getSessionTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.learnerId || !STATUSES.includes(b.status)) {
    return NextResponse.json({ error: "learnerId and valid status required" }, { status: 400 });
  }

  const cap = await reviewCapstone({
    learnerId: String(b.learnerId), status: b.status, reviewerId: trainerId,
    comments: b.comments ? String(b.comments) : undefined,
    scores: b.scores || undefined,
  });
  if (!cap) return NextResponse.json({ error: "Capstone not found" }, { status: 404 });

  let credentialId: string | undefined;
  if (b.status === "approved") {
    const existing = await getCertificateForLearner(cap.learnerId);
    if (existing) {
      credentialId = existing.credentialId;
    } else {
      const learner = await getLearnerById(cap.learnerId);
      const { cohortName } = await getAppState();
      const summary = learner ? await polishCapstone(learner, cap.title, cap.description) : cap.description;
      const cert = await issueCertificate({
        learnerId: cap.learnerId, learnerName: cap.learnerName, learnerEmail: learner?.email || "",
        cohort: cohortName, daysCompleted: learner?.completedDays.length ?? 20,
        capstoneTitle: cap.title, capstoneSummary: summary, capstoneRaw: cap.description,
      });
      credentialId = cert.credentialId;
    }
  }

  return NextResponse.json({ ok: true, capstone: cap, credentialId });
}
