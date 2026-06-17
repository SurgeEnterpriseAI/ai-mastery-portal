import { NextResponse } from "next/server";
import { getCurrentLearner, pushJourney } from "@/lib/learner";
import { getAppState, getCertificateForLearner, issueCertificate } from "@/lib/data";
import { polishCapstone } from "@/lib/claude";
import { rateLimit } from "@/lib/ratelimit";
import { TOTAL_DAYS } from "@/lib/curriculum";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // already issued? return it (idempotent)
  const existing = await getCertificateForLearner(learner.id);
  if (existing) return NextResponse.json({ ok: true, credentialId: existing.credentialId, already: true });

  if ((learner.completedDays?.length || 0) < TOTAL_DAYS) {
    return NextResponse.json({ error: `Complete all ${TOTAL_DAYS} days before claiming your certificate.` }, { status: 400 });
  }

  const rl = await rateLimit(`cert:${learner.id}`, 5, 3600);
  if (!rl.ok) return NextResponse.json({ error: `Please wait ${rl.retryAfter}s and try again.` }, { status: 429 });

  const { capstoneTitle, capstoneDescription } = await req.json().catch(() => ({}));
  const title = String(capstoneTitle || "").trim();
  const raw = String(capstoneDescription || "").trim();
  if (!title || raw.length < 40) {
    return NextResponse.json({ error: "Give your capstone a title and describe what you built (at least a few sentences)." }, { status: 400 });
  }

  const summary = await polishCapstone(learner, title, raw);
  const { cohortName } = await getAppState();
  const cert = await issueCertificate({
    learnerId: learner.id,
    learnerName: learner.name,
    learnerEmail: learner.email,
    cohort: cohortName,
    daysCompleted: learner.completedDays.length,
    capstoneTitle: title,
    capstoneSummary: summary,
    capstoneRaw: raw,
  });
  await pushJourney(learner.id, { type: "recommendation", summary: `Earned certificate ${cert.credentialId} — capstone: ${title}` });

  return NextResponse.json({ ok: true, credentialId: cert.credentialId });
}
