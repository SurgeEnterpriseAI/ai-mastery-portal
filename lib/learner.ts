import { getSessionLearnerId } from "./auth";
import { FREE_HANDHOLDING_LIMIT, type Learner, type JourneyEvent } from "./types";
import { hasEmbeddings, embedDocument } from "./embeddings";
import { buildProfileText } from "./rag";
import { getLearnerById, setLearnerEmbedding, pushJourney as dataPushJourney } from "./data";

export async function getCurrentLearner(): Promise<Learner | null> {
  const id = getSessionLearnerId();
  if (!id) return null;
  return getLearnerById(id);
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

export async function pushJourney(learnerId: string, event: Omit<JourneyEvent, "id" | "at">): Promise<void> {
  await dataPushJourney(learnerId, event);
}

/**
 * Computes & persists this learner's profile vector embedding (their personal RAG
 * vector) when Voyage is configured and the profile/journey has changed.
 */
export async function ensureProfileEmbedding(learner: Learner): Promise<Learner> {
  if (!hasEmbeddings()) return learner;
  const text = buildProfileText(learner);
  if (learner.profileEmbedding && learner.profileEmbeddingText === text) return learner;
  try {
    const vec = await embedDocument(text);
    await setLearnerEmbedding(learner.id, vec, text);
    return { ...learner, profileEmbedding: vec, profileEmbeddingText: text };
  } catch (e) {
    console.error("[learner] profile embedding failed:", (e as Error).message);
    return learner;
  }
}
