import crypto from "crypto";
import { prisma, newId } from "./data";
import type { JobRole, Opening, PlacementProfile, Placement, PlacementStatus } from "./types";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function arr<T>(v: string | null | undefined): T[] {
  try { const x = JSON.parse(v || "[]"); return Array.isArray(x) ? x : []; } catch { return []; }
}
function mapRole(r: any): JobRole {
  return {
    id: r.id, slug: r.slug, title: r.title, description: r.description,
    skills: arr<string>(r.skills), curriculumDays: arr<number>(r.curriculumDays),
    level: r.level, salaryBand: r.salaryBand, demandNotes: r.demandNotes,
    capstoneFit: r.capstoneFit, sortOrder: r.sortOrder, createdAt: r.createdAt,
  };
}
function mapOpening(o: any): Opening {
  return {
    id: o.id, roleId: o.roleId ?? undefined, title: o.title, company: o.company,
    location: o.location, mode: o.mode, packageBand: o.packageBand,
    applyUrl: o.applyUrl ?? undefined, status: o.status, postedAt: o.postedAt,
  };
}
function mapProfile(p: any): PlacementProfile {
  return { learnerId: p.learnerId, shareableSlug: p.shareableSlug, status: p.status, headline: p.headline ?? undefined, updatedAt: p.updatedAt };
}
function mapPlacement(p: any): Placement {
  return { id: p.id, learnerId: p.learnerId, learnerName: p.learnerName, role: p.role, company: p.company, packageBand: p.packageBand, date: p.date, createdAt: p.createdAt };
}

// ---------------------------------------------------------------------------
// Default job-roles seed (idempotent — only inserts when the table is empty)
// ---------------------------------------------------------------------------
const DEFAULT_ROLES: Array<Omit<JobRole, "id" | "createdAt">> = [
  {
    slug: "ai-ml-engineer", title: "AI / ML Engineer", level: "mid",
    description: "Builds, fine-tunes and ships ML/LLM models into production systems — owning data, training, evaluation and inference.",
    skills: ["Transformers", "Fine-tuning & LoRA", "Embeddings", "Inference & quantization", "Model evaluation"],
    curriculumDays: [2, 3, 6, 10, 16, 18], salaryBand: "₹8–18 LPA",
    demandNotes: "Highest-volume AI role in India; every product team scaling AI needs one.",
    capstoneFit: "A fine-tuned or RAG-backed model served via an API with evals.", sortOrder: 1,
  },
  {
    slug: "llm-application-developer", title: "LLM Application Developer", level: "entry",
    description: "Builds user-facing applications on top of LLM APIs — chat, copilots, RAG assistants and workflow tools.",
    skills: ["Prompting", "RAG", "Tool use / function calling", "Streaming UIs", "Cost & latency"],
    curriculumDays: [5, 7, 11, 12, 18, 19], salaryBand: "₹6–14 LPA",
    demandNotes: "Fastest-growing entry point into AI; strong demand from startups & services firms.",
    capstoneFit: "A working LLM app (chatbot/copilot/RAG assistant) with a live demo.", sortOrder: 2,
  },
  {
    slug: "ai-solutions-consultant", title: "AI Solutions Consultant", level: "mid",
    description: "Translates business problems into AI solutions, scopes pilots, and advises enterprises on adoption and ROI.",
    skills: ["AI strategy", "Prompting", "RAG patterns", "Agents", "Trust, safety & evaluation"],
    curriculumDays: [1, 7, 11, 12, 17], salaryBand: "₹10–20 LPA",
    demandNotes: "Surge's enterprise clients (Adobe/SAP/Salesforce ecosystems) need this bridge role.",
    capstoneFit: "An AI solution proposal + working proof-of-concept for a real use case.", sortOrder: 3,
  },
  {
    slug: "prompt-rag-engineer", title: "Prompt / RAG Engineer", level: "entry",
    description: "Designs prompts, retrieval pipelines and evaluation harnesses that make LLM outputs reliable and grounded.",
    skills: ["Prompt engineering", "Vector databases", "RAG pipelines", "Chunking & retrieval", "Eval harnesses"],
    curriculumDays: [7, 11, 12], salaryBand: "₹6–12 LPA",
    demandNotes: "Specialised, accessible to non-CS backgrounds; great for career switchers.",
    capstoneFit: "A grounded RAG system over a real document set with retrieval evals.", sortOrder: 4,
  },
  {
    slug: "ai-agent-developer", title: "AI Agent Developer", level: "mid",
    description: "Builds autonomous and tool-using agents — multi-step reasoning, function calling, MCP and computer use.",
    skills: ["Agents & tool use", "Function calling / MCP", "Reasoning models", "Orchestration", "Guardrails"],
    curriculumDays: [12, 15, 19], salaryBand: "₹10–22 LPA",
    demandNotes: "The 2026 frontier role — premium pay, scarce talent.",
    capstoneFit: "A multi-step agent that uses tools/MCP to complete a real task.", sortOrder: 5,
  },
  {
    slug: "ai-product-analyst", title: "AI Product Analyst", level: "entry",
    description: "Shapes and measures AI features — defining use cases, evaluating outputs, and turning model behaviour into product decisions.",
    skills: ["AI fundamentals", "Prompting", "RAG basics", "Evaluation", "Product sense"],
    curriculumDays: [1, 7, 11, 17], salaryBand: "₹5–10 LPA",
    demandNotes: "Ideal for analysts/PMs adding AI; bridges business and engineering.",
    capstoneFit: "An AI feature spec with an evaluation plan and a prototype.", sortOrder: 6,
  },
];

let careerSeeded = false;
export async function ensureCareerSeed(): Promise<void> {
  if (careerSeeded) return;
  const count = await prisma.jobRole.count();
  if (count === 0) {
    const now = new Date().toISOString();
    for (const r of DEFAULT_ROLES) {
      await prisma.jobRole.create({
        data: {
          id: newId("role"), createdAt: now, slug: r.slug, title: r.title, description: r.description,
          skills: JSON.stringify(r.skills), curriculumDays: JSON.stringify(r.curriculumDays),
          level: r.level, salaryBand: r.salaryBand, demandNotes: r.demandNotes, capstoneFit: r.capstoneFit, sortOrder: r.sortOrder,
        },
      });
    }
  }
  careerSeeded = true;
}

// ---------------------------------------------------------------------------
// Job roles
// ---------------------------------------------------------------------------
export async function listJobRoles(): Promise<JobRole[]> {
  await ensureCareerSeed();
  return (await prisma.jobRole.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map(mapRole);
}
export async function getJobRole(slug: string): Promise<JobRole | null> {
  const r = await prisma.jobRole.findUnique({ where: { slug } });
  return r ? mapRole(r) : null;
}
export async function upsertJobRole(input: Partial<JobRole> & { slug: string; title: string }): Promise<JobRole> {
  const data = {
    title: input.title, description: input.description || "", skills: JSON.stringify(input.skills || []),
    curriculumDays: JSON.stringify(input.curriculumDays || []), level: input.level || "entry",
    salaryBand: input.salaryBand || "", demandNotes: input.demandNotes || "", capstoneFit: input.capstoneFit || "",
    sortOrder: input.sortOrder ?? 0,
  };
  const r = await prisma.jobRole.upsert({
    where: { slug: input.slug },
    update: data,
    create: { id: newId("role"), slug: input.slug, createdAt: new Date().toISOString(), ...data },
  });
  return mapRole(r);
}
export async function deleteJobRole(slug: string): Promise<void> {
  await prisma.jobRole.deleteMany({ where: { slug } });
}

// ---------------------------------------------------------------------------
// Openings
// ---------------------------------------------------------------------------
export async function listOpenings(opts?: { roleId?: string; openOnly?: boolean }): Promise<Opening[]> {
  return (await prisma.opening.findMany({
    where: { ...(opts?.roleId ? { roleId: opts.roleId } : {}), ...(opts?.openOnly ? { status: "open" } : {}) },
    orderBy: { postedAt: "desc" },
  })).map(mapOpening);
}
export async function createOpening(input: Omit<Opening, "id" | "postedAt" | "status"> & { status?: string }): Promise<Opening> {
  const o = await prisma.opening.create({
    data: {
      id: newId("open"), postedAt: new Date().toISOString(), status: input.status || "open",
      roleId: input.roleId || null, title: input.title, company: input.company, location: input.location,
      mode: input.mode, packageBand: input.packageBand, applyUrl: input.applyUrl || null,
    },
  });
  return mapOpening(o);
}
export async function setOpeningStatus(id: string, status: string): Promise<void> {
  await prisma.opening.update({ where: { id }, data: { status } });
}
export async function deleteOpening(id: string): Promise<void> {
  await prisma.opening.deleteMany({ where: { id } });
}

// ---------------------------------------------------------------------------
// Placement profiles + placements
// ---------------------------------------------------------------------------
function genSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "learner";
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}
export async function getPlacementProfile(learnerId: string): Promise<PlacementProfile | null> {
  const p = await prisma.placementProfile.findUnique({ where: { learnerId } });
  return p ? mapProfile(p) : null;
}
export async function getProfileBySlug(slug: string): Promise<PlacementProfile | null> {
  const p = await prisma.placementProfile.findUnique({ where: { shareableSlug: slug } });
  return p ? mapProfile(p) : null;
}
export async function ensurePlacementProfile(learnerId: string, name: string): Promise<PlacementProfile> {
  const existing = await prisma.placementProfile.findUnique({ where: { learnerId } });
  if (existing) return mapProfile(existing);
  const p = await prisma.placementProfile.create({
    data: { learnerId, shareableSlug: genSlug(name), status: "ready", updatedAt: new Date().toISOString() },
  });
  return mapProfile(p);
}
export async function setPlacementStatus(learnerId: string, name: string, status: PlacementStatus, headline?: string): Promise<PlacementProfile> {
  await ensurePlacementProfile(learnerId, name);
  const p = await prisma.placementProfile.update({
    where: { learnerId },
    data: { status, ...(headline !== undefined ? { headline } : {}), updatedAt: new Date().toISOString() },
  });
  return mapProfile(p);
}
export async function listPlacements(): Promise<Placement[]> {
  return (await prisma.placement.findMany({ orderBy: { date: "desc" } })).map(mapPlacement);
}
export async function createPlacement(input: Omit<Placement, "id" | "createdAt">): Promise<Placement> {
  const p = await prisma.placement.create({ data: { id: newId("plc"), createdAt: new Date().toISOString(), ...input } });
  // mark the learner's profile as placed
  await prisma.placementProfile.updateMany({ where: { learnerId: input.learnerId }, data: { status: "placed", updatedAt: new Date().toISOString() } });
  return mapPlacement(p);
}
export async function deletePlacement(id: string): Promise<void> {
  await prisma.placement.deleteMany({ where: { id } });
}

/** Public, hiring-partner-facing profile (no email/PII beyond name). */
export async function getPublicProfile(slug: string): Promise<{
  name: string; headline?: string; status: PlacementStatus;
  completedDays: number[]; daysCompleted: number;
  certificate: { credentialId: string; capstoneTitle: string; capstoneSummary: string } | null;
} | null> {
  const p = await prisma.placementProfile.findUnique({ where: { shareableSlug: slug } });
  if (!p) return null;
  const learner = await prisma.learner.findUnique({ where: { id: p.learnerId } });
  if (!learner) return null;
  const cert = await prisma.certificate.findUnique({ where: { learnerId: p.learnerId } });
  return {
    name: learner.name,
    headline: p.headline ?? undefined,
    status: p.status as PlacementStatus,
    completedDays: arr<number>(learner.completedDays),
    daysCompleted: arr<number>(learner.completedDays).length,
    certificate: cert && cert.status === "valid"
      ? { credentialId: cert.credentialId, capstoneTitle: cert.capstoneTitle, capstoneSummary: cert.capstoneSummary }
      : null,
  };
}

/** Learners + their cert/profile state, for the admin placements screen. */
export async function adminPlacementData(): Promise<Array<{
  learnerId: string; name: string; email: string; daysCompleted: number;
  certified: boolean; profileStatus: PlacementStatus | null; slug: string | null; headline: string | null;
}>> {
  const [learners, certs, profiles] = await Promise.all([
    prisma.learner.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.certificate.findMany({ where: { status: "valid" } }),
    prisma.placementProfile.findMany(),
  ]);
  const certSet = new Set(certs.map((c) => c.learnerId));
  const profMap = new Map(profiles.map((p) => [p.learnerId, p]));
  return learners.map((l) => {
    const p = profMap.get(l.id);
    return {
      learnerId: l.id, name: l.name, email: l.email, daysCompleted: arr<number>(l.completedDays).length,
      certified: certSet.has(l.id),
      profileStatus: (p?.status as PlacementStatus) ?? null,
      slug: p?.shareableSlug ?? null,
      headline: p?.headline ?? null,
    };
  });
}

/** Aggregate placement stats for the landing-page social proof. */
export async function placementStats(): Promise<{ placed: number; placementReady: number; certified: number; placedPct: number }> {
  const [placed, ready, certified] = await Promise.all([
    prisma.placement.count(),
    prisma.placementProfile.count({ where: { status: { in: ["ready", "in_process", "placed"] } } }),
    prisma.certificate.count({ where: { status: "valid" } }),
  ]);
  const placedPct = certified > 0 ? Math.round((placed / certified) * 100) : 0;
  return { placed, placementReady: ready, certified, placedPct };
}
