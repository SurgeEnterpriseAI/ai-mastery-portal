import { prisma, newId } from "./data";
import { ensureCareerSeed } from "./careers";

// Idempotent demo/starter content so the public hub is never empty pre-launch.
// Only inserts into a table when that table is empty.
let demoSeeded = false;

// Live India job-search results (deep links to current, filtered listings on the
// major India boards). Refreshed via web search; "Apply / details" opens the real
// listing page. source="seed" — replaced on each deploy/cold-start.
const OPENINGS: Array<{ roleSlug?: string; title: string; company: string; location: string; mode: string; packageBand: string; url: string }> = [
  { roleSlug: "ai-ml-engineer", title: "AI / ML Engineer — Fresher", company: "Multiple · via Naukri India", location: "India", mode: "onsite", packageBand: "₹6–12 LPA", url: "https://www.naukri.com/fresher-artificial-intelligence-jobs" },
  { roleSlug: "ai-ml-engineer", title: "Machine Learning Engineer", company: "Multiple · via Wellfound", location: "India", mode: "hybrid", packageBand: "₹8–18 LPA", url: "https://wellfound.com/role/l/machine-learning-engineer/india" },
  { roleSlug: "ai-ml-engineer", title: "AI Engineer", company: "Multiple · via Wellfound", location: "India", mode: "hybrid", packageBand: "₹10–20 LPA", url: "https://wellfound.com/role/l/ai-engineer/india" },
  { roleSlug: "ai-ml-engineer", title: "Machine Learning Engineer — Entry level", company: "Multiple · via LinkedIn India", location: "India", mode: "onsite", packageBand: "₹6–10 LPA", url: "https://in.linkedin.com/jobs/machine-learning-entry-level-jobs" },
  { roleSlug: "ai-product-analyst", title: "Artificial Intelligence — Fresher roles", company: "Multiple · via Internshala", location: "India", mode: "onsite", packageBand: "₹4–8 LPA", url: "https://internshala.com/fresher-jobs/artificial-intelligence-ai-jobs/" },
  { roleSlug: "ai-ml-engineer", title: "ML / AI Engineer — Fresher", company: "Multiple · via Indeed India", location: "India", mode: "onsite", packageBand: "₹6–10 LPA", url: "https://in.indeed.com/q-machine-learning-ai-engineer-fresher-jobs.html" },
  { roleSlug: "llm-application-developer", title: "Generative AI Engineer", company: "Multiple · via LinkedIn India", location: "India", mode: "hybrid", packageBand: "₹10–22 LPA", url: "https://in.linkedin.com/jobs/generative-ai-engineer-jobs" },
  { roleSlug: "llm-application-developer", title: "Gen AI roles", company: "Multiple · via Naukri India", location: "India", mode: "hybrid", packageBand: "₹10–20 LPA", url: "https://www.naukri.com/gen-ai-jobs" },
  { roleSlug: "ai-agent-developer", title: "Generative AI · LLM · NLP", company: "Multiple · via Indeed", location: "Bengaluru", mode: "onsite", packageBand: "₹12–24 LPA", url: "https://in.indeed.com/q-generative-ai,-llm,-nlp-l-bengaluru,-karnataka-jobs.html" },
  { roleSlug: "ai-agent-developer", title: "LLM Engineer roles", company: "Multiple · via Naukri", location: "Hyderabad", mode: "onsite", packageBand: "₹12–24 LPA", url: "https://www.naukri.com/llm-jobs-in-hyderabad-secunderabad" },
  { roleSlug: "ai-ml-engineer", title: "AI / ML Engineer", company: "Multiple · via LinkedIn India", location: "Hyderabad", mode: "hybrid", packageBand: "₹10–20 LPA", url: "https://in.linkedin.com/jobs/ai-ml-engineer-jobs-hyderabad" },
  { roleSlug: "ai-ml-engineer", title: "AI / ML Engineer", company: "Multiple · via LinkedIn India", location: "Bengaluru", mode: "hybrid", packageBand: "₹10–20 LPA", url: "https://in.linkedin.com/jobs/ai-ml-engineer-jobs-bengaluru" },
  { roleSlug: "ai-agent-developer", title: "LLM Engineer roles", company: "Multiple · via hirist.tech", location: "Bangalore", mode: "hybrid", packageBand: "₹12–22 LPA", url: "https://www.hirist.tech/llm-jobs-in-bangalore" },
  { roleSlug: "llm-application-developer", title: "Generative AI Engineer", company: "Multiple · via Indeed", location: "Bengaluru", mode: "onsite", packageBand: "₹10–20 LPA", url: "https://in.indeed.com/q-generative-ai-l-bengaluru,-karnataka-jobs.html" },
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

  // Refresh the India job-search results each cold-start (manual/scraped untouched).
  await prisma.opening.deleteMany({ where: { source: "seed" } });
  for (const o of OPENINGS) {
    await prisma.opening.create({
      data: {
        id: newId("open"), postedAt: now, status: "open", source: "seed",
        roleId: roleId(o.roleSlug), title: o.title, company: o.company,
        location: o.location, mode: o.mode, packageBand: o.packageBand, applyUrl: o.url,
      },
    });
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
