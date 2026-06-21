import { NextResponse } from "next/server";
import { getCurrentLearner, pushJourney } from "@/lib/learner";
import { submitCapstone, getCapstone } from "@/lib/capstone";
import { rateLimit } from "@/lib/ratelimit";
import { TOTAL_DAYS } from "@/lib/curriculum";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((learner.completedDays?.length || 0) < TOTAL_DAYS) {
    return NextResponse.json({ error: `Complete all ${TOTAL_DAYS} days before submitting your capstone.` }, { status: 400 });
  }
  const rl = await rateLimit(`capstone:${learner.id}`, 10, 3600);
  if (!rl.ok) return NextResponse.json({ error: `Please wait ${rl.retryAfter}s and try again.` }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const title = String(b.title || "").trim();
  const description = String(b.description || "").trim();
  if (!title || description.length < 40) {
    return NextResponse.json({ error: "Give your capstone a title and describe what you built (at least a few sentences)." }, { status: 400 });
  }
  // Only allow http(s) URLs — these get rendered as clickable links in the admin
  // review panel, so a `javascript:` URI would be stored XSS.
  const safeUrl = (u: string) => /^https?:\/\//i.test(u);
  const rawLinks: string[] = Array.isArray(b.links) ? b.links.map(String) : String(b.links || "").split(/[\n,]/);
  const links = rawLinks.map((s) => s.trim()).filter(Boolean).filter(safeUrl);
  const fileUrl = b.fileUrl && safeUrl(String(b.fileUrl)) ? String(b.fileUrl) : undefined;

  const cap = await submitCapstone({
    learnerId: learner.id, learnerName: learner.name, title, description, links: links.slice(0, 8),
    fileUrl,
  });
  await pushJourney(learner.id, { type: "recommendation", summary: `Submitted capstone for review: ${title}` });
  return NextResponse.json({ ok: true, capstone: cap });
}

export async function GET() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ capstone: await getCapstone(learner.id) });
}
