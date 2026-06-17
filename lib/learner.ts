import { readDB, mutateDB, newId } from "./db";
import { getSessionLearnerId } from "./auth";
import { FREE_HANDHOLDING_LIMIT, type Learner, type JourneyEvent } from "./types";
import { hasEmbeddings, embedDocument } from "./embeddings";
import { buildProfileText } from "./rag";

export async function getCurrentLearner(): Promise<Learner | null> {
  const id = getSessionLearnerId();
  if (!id) return null;
  return (await readDB()).learners.find((l) => l.id === id) || null;
}

export interface GateStatus {
  locked: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export function gateStatus(learner: Learner): GateStatus {
  const used = learner.handholdingCount;
  const limit = FREE_HANDHOLDING_LIMIT;
  const unlimited = learner.paid || learner.plan === "pro";
  return { locked: !unlimited && used >= limit, used, limit, remaining: unlimited ? Infinity : Math.max(0, limit - used) };
}

export async function pushJourney(learnerId: string, event: Omit<JourneyEvent, "id" | "at">) {
  await mutateDB((db) => {
    const l = db.learners.find((x) => x.id === learnerId);
    if (!l) return;
    l.journey.push({ ...event, id: newId("jrn"), at: new Date().toISOString() });
    if (l.journey.length > 100) l.journey = l.journey.slice(-100);
  });
}

/**
 * Computes & persists this learner's profile vector embedding (their personal
 * RAG vector) when Voyage is configured and the profile/journey has changed.
 * Returns the learner with the freshest embedding attached.
 */
export async function ensureProfileEmbedding(learner: Learner): Promise<Learner> {
  if (!hasEmbeddings()) return learner;
  const text = buildProfileText(learner);
  if (learner.profileEmbedding && learner.profileEmbeddingText === text) return learner;
  try {
    const vec = await embedDocument(text);
    await mutateDB((db) => {
      const l = db.learners.find((x) => x.id === learner.id);
      if (l) {
        l.profileEmbedding = vec;
        l.profileEmbeddingText = text;
      }
    });
    return { ...learner, profileEmbedding: vec, profileEmbeddingText: text };
  } catch (e) {
    console.error("[learner] profile embedding failed:", (e as Error).message);
    return learner;
  }
}
