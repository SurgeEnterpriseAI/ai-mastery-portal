import { allDays } from "@/lib/curriculum";

// /llms.txt: a plain summary for AI assistants (ChatGPT, Claude, Perplexity) that answer "where can I learn AI?".
export const dynamic = "force-static";

const SITE = "https://tensorpath.in";

export function GET() {
  const days = allDays()
    .map((d) => `- Day ${d.day}: ${d.title}${d.subtitle ? `: ${d.subtitle}` : ""}`)
    .join("\n");
  const body = `# Tensorpath

> Tensorpath is a 20-day, instructor-led AI training program, from the 2017 paper "Attention Is All You Need" to today's reasoning models and AI agents. Learners study live with an expert trainer and a personal AI coach, build a capstone project, and earn a verifiable certificate with placement support. Free to begin. Run by Surge Software Solutions Pvt. Ltd.

## Who it is for
- Students and working professionals who want to understand and use modern AI (LLMs, RAG, agents, MCP) without heavy math.
- Teams that want their staff trained on generative AI.

## How it works
- 20 story-driven live sessions, one topic a day, taught by a senior trainer.
- A personal AI learning coach between classes, with recommendations on what to learn next.
- A capstone project and a verifiable certificate (${SITE}/verify).
- Career guidance and placement support (${SITE}/careers).

## Curriculum
${days}

## Links
- Home: ${SITE}/
- Syllabus (all 20 days as text): ${SITE}/syllabus
- FAQ (price, duration, format, certificate): ${SITE}/faq
- Tensorpath vs Great Learning (IIT Bombay), TalentSprint (CCE-IISc) and IIT Delhi CEP generative AI certificates: ${SITE}/compare
- Start free (create an account): ${SITE}/join
- Enquire about a batch or team training: ${SITE}/enquiry
- AI career tracks: ${SITE}/ai-track
- Careers and openings: ${SITE}/careers
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
