import type { Learner } from "./types";
import { getAllDayMeta, allDays, TOTAL_DAYS } from "./curriculum";
import { hasEmbeddings, embedQuery, retrieveByVector, normalizeAdd, type ChunkMeta } from "./embeddings";

// ---------------------------------------------------------------------------
// Keyword retrieval (fallback when Voyage embeddings are not configured)
// ---------------------------------------------------------------------------

interface KwChunk extends ChunkMeta {
  terms: Map<string, number>;
}
let kwIndex: KwChunk[] | null = null;

const STOP = new Set(
  "the a an and or of to in on for is are be as it its this that with you your we our they them from at by into about how what why when which can will would could".split(/\s+/),
);
function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2 && !STOP.has(t));
}
function keywordIndex(): KwChunk[] {
  if (kwIndex) return kwIndex;
  const chunks: KwChunk[] = [];
  for (const day of allDays()) {
    for (const slide of day.slides || []) {
      const terms = new Map<string, number>();
      for (const t of tokenize(slide.title)) terms.set(t, (terms.get(t) || 0) + 3);
      for (const t of tokenize(slide.body)) terms.set(t, (terms.get(t) || 0) + 1);
      chunks.push({
        day: day.day,
        dayTitle: day.title,
        slideTitle: slide.title,
        snippet: `${slide.title}\n${slide.body}`.slice(0, 900),
        terms,
      });
    }
  }
  kwIndex = chunks;
  return chunks;
}
function retrieveKeyword(query: string, k = 6): ChunkMeta[] {
  const q = tokenize(query);
  if (!q.length) return [];
  return keywordIndex()
    .map((c) => ({ c, score: q.reduce((s, t) => s + (c.terms.get(t) || 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => ({ day: x.c.day, dayTitle: x.c.dayTitle, slideTitle: x.c.slideTitle, snippet: x.c.snippet }));
}

// ---------------------------------------------------------------------------
// Per-learner profile text + vector retrieval
// ---------------------------------------------------------------------------

export function buildProfileText(learner: Learner): string {
  const journey = learner.journey.slice(-10).map((e) => e.summary).join("; ");
  return [
    `Goals: ${learner.goals || "learn AI"}`,
    `Background: ${learner.background || "unspecified"}`,
    `Level: ${learner.level || "unspecified"}`,
    `Recent activity: ${journey || "just started"}`,
  ].join("\n");
}

export function courseOverview(): string {
  return getAllDayMeta()
    .map((d) => `Day ${d.day}: ${d.title} — ${d.theme || d.subtitle}`)
    .join("\n");
}

/** Retrieves the most relevant curriculum chunks for this learner + question. */
async function retrieve(learner: Learner, query: string): Promise<{ chunks: ChunkMeta[]; mode: "vector" | "keyword" }> {
  if (hasEmbeddings()) {
    try {
      const queryVec = await embedQuery(query);
      // per-learner vector: blend the learner's persisted profile embedding with the live question
      const retrievalVec = normalizeAdd(learner.profileEmbedding, queryVec, 0.4, 0.6);
      const chunks = await retrieveByVector(retrievalVec.length ? retrievalVec : queryVec, 6);
      return { chunks, mode: "vector" };
    } catch (e) {
      console.error("[rag] vector retrieval failed, falling back to keyword:", (e as Error).message);
    }
  }
  return { chunks: retrieveKeyword(`${learner.goals} ${query}`, 6), mode: "keyword" };
}

/**
 * Assembles the retrieval-augmented context for the coach: the learner's
 * profile + journey (RAG memory), where the cohort is, and the most relevant
 * curriculum passages (vector-retrieved when Voyage is configured).
 */
export async function assembleCoachContext(
  learner: Learner,
  currentDay: number,
  completedDays: number[],
  query: string,
): Promise<string> {
  const { chunks, mode } = await retrieve(learner, query);

  const journey = learner.journey.slice(-12).map((e) => `- [${e.type}] ${e.summary}`).join("\n");
  const relevantText = chunks.length
    ? chunks.map((r, i) => `### Passage ${i + 1} — Day ${r.day} (${r.dayTitle}) · "${r.slideTitle}"\n${r.snippet}`).join("\n\n")
    : "(No specific passage matched — answer from the course arc above and your expertise.)";

  return `## The 20-Day AI Mastery Course (the syllabus you are coaching against)
${courseOverview()}

## This learner's profile
- Name: ${learner.name}
- Background: ${learner.background || "(not specified)"}
- Goals: ${learner.goals || "(not specified)"}
- Self-rated level: ${learner.level || "(not specified)"}

## This learner's journey so far (their personal RAG memory)
- Days completed by the cohort: ${completedDays.length ? completedDays.join(", ") : "none yet"}
- The class is currently on Day ${currentDay} of ${TOTAL_DAYS}
Recent journey events:
${journey || "- (just getting started)"}

## Most relevant course passages for this question (retrieved via ${mode} search)
${relevantText}`;
}
