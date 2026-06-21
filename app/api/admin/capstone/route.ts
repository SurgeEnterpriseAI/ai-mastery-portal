import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { reviewCapstone } from "@/lib/capstone";
import { getAppState, getCertificateForLearner, issueCertificate, getLearnerById } from "@/lib/data";
import { polishCapstone } from "@/lib/claude";
import { sendMail, capstoneReviewedEmail } from "@/lib/email";

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

  const learner = await getLearnerById(cap.learnerId);
  const origin = new URL(req.url).origin;

  let credentialId: string | undefined;
  if (b.status === "approved") {
    const existing = await getCertificateForLearner(cap.learnerId);
    if (existing) {
      credentialId = existing.credentialId;
    } else {
      const { cohortName } = await getAppState();
      // Never let an LLM hiccup block certificate issuance — fall back to the raw description.
      let summary = cap.description;
      if (learner) {
        try { summary = await polishCapstone(learner, cap.title, cap.description); }
        catch (e) { console.error("[capstone] polish failed, using raw description:", (e as Error).message); }
      }
      const cert = await issueCertificate({
        learnerId: cap.learnerId, learnerName: cap.learnerName, learnerEmail: learner?.email || "",
        cohort: cohortName, daysCompleted: learner?.completedDays.length ?? 20,
        capstoneTitle: cap.title, capstoneSummary: summary, capstoneRaw: cap.description,
      });
      credentialId = cert.credentialId;
    }
  }

  // Notify the learner (Module H): approval (cert issued) or revisions (feedback).
  if (learner?.email && (b.status === "approved" || b.status === "revisions")) {
    const mail = capstoneReviewedEmail({
      name: cap.learnerName, title: cap.title, approved: b.status === "approved",
      feedback: cap.comments, portalUrl: `${origin}/learn/certificate`,
    });
    await sendMail({ to: [learner.email], subject: mail.subject, body: mail.body, kind: "welcome" });
  }

  return NextResponse.json({ ok: true, capstone: cap, credentialId });
}
