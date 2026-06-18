import { prisma, newId } from "./data";
import type { Capstone, CapstoneStatus } from "./types";

function arr<T>(v: string | null | undefined): T[] {
  try { const x = JSON.parse(v || "[]"); return Array.isArray(x) ? x : []; } catch { return []; }
}
function map(c: any): Capstone {
  return {
    id: c.id, learnerId: c.learnerId, learnerName: c.learnerName, title: c.title, description: c.description,
    links: arr<string>(c.links), fileUrl: c.fileUrl ?? undefined, status: c.status,
    scoreUnderstanding: c.scoreUnderstanding ?? undefined, scoreImplementation: c.scoreImplementation ?? undefined,
    scoreCompleteness: c.scoreCompleteness ?? undefined, scorePresentation: c.scorePresentation ?? undefined,
    comments: c.comments ?? undefined, reviewerId: c.reviewerId ?? undefined,
    submittedAt: c.submittedAt, reviewedAt: c.reviewedAt ?? undefined,
  };
}

export async function getCapstone(learnerId: string): Promise<Capstone | null> {
  const c = await prisma.capstone.findUnique({ where: { learnerId } });
  return c ? map(c) : null;
}

/** Student submits or re-submits (after revisions). Resets review state to "submitted". */
export async function submitCapstone(input: {
  learnerId: string; learnerName: string; title: string; description: string; links: string[]; fileUrl?: string;
}): Promise<Capstone> {
  const now = new Date().toISOString();
  const c = await prisma.capstone.upsert({
    where: { learnerId: input.learnerId },
    update: {
      title: input.title, description: input.description, links: JSON.stringify(input.links), fileUrl: input.fileUrl || null,
      status: "submitted", comments: null, reviewedAt: null,
      scoreUnderstanding: null, scoreImplementation: null, scoreCompleteness: null, scorePresentation: null,
      submittedAt: now,
    },
    create: {
      id: newId("cap"), learnerId: input.learnerId, learnerName: input.learnerName,
      title: input.title, description: input.description, links: JSON.stringify(input.links), fileUrl: input.fileUrl || null,
      status: "submitted", submittedAt: now,
    },
  });
  return map(c);
}

export async function listCapstonesForReview(): Promise<Capstone[]> {
  return (await prisma.capstone.findMany({ orderBy: { submittedAt: "desc" } })).map(map);
}

export async function reviewCapstone(input: {
  learnerId: string; status: CapstoneStatus; reviewerId?: string; comments?: string;
  scores?: { understanding?: number; implementation?: number; completeness?: number; presentation?: number };
}): Promise<Capstone | null> {
  try {
    const c = await prisma.capstone.update({
      where: { learnerId: input.learnerId },
      data: {
        status: input.status, reviewerId: input.reviewerId || null, comments: input.comments ?? null,
        reviewedAt: new Date().toISOString(),
        scoreUnderstanding: input.scores?.understanding ?? null,
        scoreImplementation: input.scores?.implementation ?? null,
        scoreCompleteness: input.scores?.completeness ?? null,
        scorePresentation: input.scores?.presentation ?? null,
      },
    });
    return map(c);
  } catch { return null; }
}
