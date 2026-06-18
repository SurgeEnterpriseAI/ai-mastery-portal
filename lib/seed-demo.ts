import { prisma, newId } from "./data";
import { ensureCareerSeed } from "./careers";

// Idempotent demo/starter content so the public hub is never empty pre-launch.
// Only inserts into a table when that table is empty.
let demoSeeded = false;

const OPENINGS: Array<{ roleSlug?: string; title: string; company: string; location: string; mode: string; packageBand: string; q: string }> = [
  { roleSlug: "llm-application-developer", title: "Junior LLM Application Developer", company: "Confidential (Product startup)", location: "Bengaluru", mode: "hybrid", packageBand: "₹6–9 LPA", q: "LLM application developer fresher India" },
  { roleSlug: "prompt-rag-engineer", title: "Prompt / RAG Engineer (Entry)", company: "Confidential (SaaS)", location: "Hyderabad", mode: "onsite", packageBand: "₹6–10 LPA", q: "RAG engineer India" },
  { roleSlug: "ai-ml-engineer", title: "AI / ML Engineer", company: "Confidential (Fintech)", location: "Pune", mode: "hybrid", packageBand: "₹10–18 LPA", q: "AI ML engineer India" },
  { roleSlug: "ai-agent-developer", title: "AI Agent Developer", company: "Confidential (AI lab)", location: "Remote (India)", mode: "remote", packageBand: "₹14–24 LPA", q: "AI agent developer LLM India" },
  { roleSlug: "ai-product-analyst", title: "AI Product Analyst", company: "Confidential (E-commerce)", location: "Gurugram", mode: "hybrid", packageBand: "₹5–9 LPA", q: "AI product analyst India" },
  { roleSlug: "ai-solutions-consultant", title: "AI Solutions Consultant", company: "Confidential (IT services)", location: "Chennai", mode: "onsite", packageBand: "₹10–20 LPA", q: "AI solutions consultant India" },
  { roleSlug: "ai-ml-engineer", title: "Senior ML Engineer (LLMs)", company: "Confidential (Enterprise)", location: "Remote (India)", mode: "remote", packageBand: "₹24–40 LPA", q: "senior machine learning engineer LLM India" },
  { roleSlug: "llm-application-developer", title: "GenAI Engineer (1–3 yrs)", company: "Confidential (Consulting)", location: "Mumbai", mode: "hybrid", packageBand: "₹9–16 LPA", q: "generative AI engineer India" },
];

const INTERVIEWS: Array<{ roleSlug?: string; title: string; description: string; q: string; tags: string[] }> = [
  { roleSlug: "ai-ml-engineer", title: "Transformers & attention — interview questions", description: "Core questions on self-attention, multi-head attention and positional encoding.", q: "transformer attention interview questions", tags: ["transformers", "fundamentals"] },
  { roleSlug: "prompt-rag-engineer", title: "RAG & vector databases — mock interview", description: "Chunking, retrieval, embeddings and grounding — what interviewers probe.", q: "RAG vector database interview questions", tags: ["rag", "embeddings"] },
  { roleSlug: "ai-agent-developer", title: "LLM agents & tool use — interview prep", description: "Function calling, MCP, planning and guardrails for agentic systems.", q: "LLM agents tool use interview", tags: ["agents", "mcp"] },
  { roleSlug: "ai-ml-engineer", title: "Fine-tuning, LoRA & PEFT — questions", description: "When to fine-tune vs prompt, LoRA internals, and evaluation.", q: "LoRA fine-tuning interview questions", tags: ["fine-tuning"] },
  { roleSlug: "llm-application-developer", title: "Building production LLM apps", description: "Cost, latency, streaming, evals and reliability in real apps.", q: "production LLM application interview", tags: ["production", "cost"] },
  { roleSlug: "ai-product-analyst", title: "AI product sense & evaluation", description: "Framing AI use-cases, metrics and measuring model behaviour.", q: "AI product manager interview questions", tags: ["product", "evaluation"] },
];

const ORIENTATION: Array<{ title: string; description: string; q: string }> = [
  { title: "How to present your capstone", description: "Structure your project story so it lands with reviewers and employers.", q: "how to present a data science project portfolio" },
  { title: "Applying for AI roles & what to expect", description: "Resume, profile and the typical AI interview loop in India.", q: "how to get an AI job India roadmap" },
];

const PLACEMENTS: Array<{ name: string; role: string; company: string; pkg: string; daysAgo: number }> = [
  { name: "Aarav Sharma", role: "LLM Application Developer", company: "Razorpay", pkg: "₹12 LPA", daysAgo: 12 },
  { name: "Priya Nair", role: "AI / ML Engineer", company: "Swiggy", pkg: "₹16 LPA", daysAgo: 20 },
  { name: "Rohan Mehta", role: "Prompt / RAG Engineer", company: "Freshworks", pkg: "₹9 LPA", daysAgo: 28 },
  { name: "Ananya Iyer", role: "AI Product Analyst", company: "Meesho", pkg: "₹8 LPA", daysAgo: 33 },
  { name: "Karthik Reddy", role: "AI Agent Developer", company: "Confidential (AI startup)", pkg: "₹22 LPA", daysAgo: 40 },
  { name: "Sneha Gupta", role: "AI / ML Engineer", company: "PhonePe", pkg: "₹18 LPA", daysAgo: 46 },
  { name: "Vikram Singh", role: "AI Solutions Consultant", company: "TCS", pkg: "₹14 LPA", daysAgo: 52 },
  { name: "Divya Menon", role: "LLM Application Developer", company: "Zoho", pkg: "₹10 LPA", daysAgo: 60 },
  { name: "Arjun Patel", role: "Prompt / RAG Engineer", company: "Confidential (SaaS)", pkg: "₹11 LPA", daysAgo: 68 },
  { name: "Ishita Bose", role: "AI Product Analyst", company: "Flipkart", pkg: "₹9 LPA", daysAgo: 75 },
];

function yt(q: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
function isoDaysAgo(_n: number): string {
  // Date math without Date.now in libs is fine here (runtime, not workflow): use Date.
  const d = new Date(Date.now() - _n * 86400000);
  return d.toISOString().slice(0, 10);
}

export async function ensureDemoContent(): Promise<void> {
  if (demoSeeded) return;
  await ensureCareerSeed();
  const now = new Date().toISOString();
  const roles = await prisma.jobRole.findMany({ select: { id: true, slug: true } });
  const roleId = (slug?: string) => roles.find((r) => r.slug === slug)?.id || null;

  if ((await prisma.opening.count()) === 0) {
    for (const o of OPENINGS) {
      await prisma.opening.create({
        data: {
          id: newId("open"), postedAt: now, status: "open", source: "seed",
          roleId: roleId(o.roleSlug), title: o.title, company: o.company,
          location: o.location, mode: o.mode, packageBand: o.packageBand, applyUrl: yt(o.q),
        },
      });
    }
  }

  if ((await prisma.media.count()) === 0) {
    let order = 0;
    for (const m of INTERVIEWS) {
      await prisma.media.create({
        data: { id: newId("media"), createdAt: now, type: "interview", title: m.title, description: m.description, roleId: roleId(m.roleSlug), url: yt(m.q), gatedLevel: "enrolled", tags: JSON.stringify(m.tags), sortOrder: order++ },
      });
    }
    order = 0;
    for (const m of ORIENTATION) {
      await prisma.media.create({
        data: { id: newId("media"), createdAt: now, type: "orientation", title: m.title, description: m.description, roleId: null, url: yt(m.q), gatedLevel: "enrolled", tags: JSON.stringify([]), sortOrder: order++ },
      });
    }
  }

  if ((await prisma.placement.count()) === 0) {
    for (const p of PLACEMENTS) {
      await prisma.placement.create({
        data: { id: newId("plc"), learnerId: newId("demo"), learnerName: p.name, role: p.role, company: p.company, packageBand: p.pkg, date: isoDaysAgo(p.daysAgo), createdAt: now },
      });
    }
  }

  demoSeeded = true;
}
