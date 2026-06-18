import { prisma, newId } from "./data";

// Keywords that mark a posting as AI/ML-relevant.
const AI_KEYWORDS = ["ai", "a.i", "machine learning", "ml engineer", "ml ", "llm", "nlp", "deep learning", "generative", "genai", "data scientist", "ml/ai", "prompt", "rag", "computer vision", "mlops"];

function looksAI(text: string): boolean {
  const t = ` ${text.toLowerCase()} `;
  return AI_KEYWORDS.some((k) => t.includes(k));
}

interface Incoming { title: string; company: string; location: string; url: string; band: string }

// RemoteOK exposes a public JSON feed of tech jobs (attribution requested).
async function fromRemoteOK(): Promise<Incoming[]> {
  const res = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "TensorpathJobsBot/1.0 (+https://tensorpath.vercel.app)", Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RemoteOK ${res.status}`);
  const data = (await res.json()) as any[];
  const jobs = data.filter((j) => j && j.position); // first element is a legal notice
  const out: Incoming[] = [];
  for (const j of jobs) {
    const hay = `${j.position || ""} ${(j.tags || []).join(" ")} ${j.description || ""}`;
    if (!looksAI(hay)) continue;
    let band = "";
    if (j.salary_min && j.salary_max) band = `$${Math.round(j.salary_min / 1000)}k–${Math.round(j.salary_max / 1000)}k`;
    out.push({
      title: String(j.position).slice(0, 140),
      company: String(j.company || "Confidential").slice(0, 120),
      location: String(j.location || "Remote").slice(0, 80) || "Remote",
      url: j.url || (j.id ? `https://remoteok.com/remote-jobs/${j.id}` : "https://remoteok.com"),
      band,
    });
  }
  return out;
}

/**
 * Pull fresh AI openings from public job feeds and replace the previously-scraped
 * set (admin- and seed-added openings are untouched). Returns how many were ingested.
 * Fails soft: on any error the existing board is left intact.
 */
export async function ingestOpenings(limit = 20): Promise<{ ok: boolean; ingested: number; error?: string }> {
  let incoming: Incoming[] = [];
  try {
    incoming = await fromRemoteOK();
  } catch (e) {
    return { ok: false, ingested: 0, error: (e as Error).message };
  }
  if (incoming.length === 0) return { ok: true, ingested: 0 };

  // de-dupe by url, cap
  const seen = new Set<string>();
  const fresh = incoming.filter((j) => (seen.has(j.url) ? false : (seen.add(j.url), true))).slice(0, limit);

  const now = new Date().toISOString();
  await prisma.opening.deleteMany({ where: { source: "scraped" } });
  for (const j of fresh) {
    await prisma.opening.create({
      data: {
        id: newId("open"), postedAt: now, status: "open", source: "scraped", roleId: null,
        title: j.title, company: j.company, location: j.location, mode: "remote",
        packageBand: j.band, applyUrl: j.url,
      },
    });
  }
  return { ok: true, ingested: fresh.length };
}
