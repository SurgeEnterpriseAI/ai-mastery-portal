import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, Learner } from "./types";
import { assembleCoachContext, courseOverview } from "./rag";

const MODEL = process.env.COACH_MODEL || "claude-opus-4-8";

export function hasClaudeKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return _client;
}

const PERSONA = `You are "Aria", the personal AI learning coach inside Tensorpath — a 20-day, story-driven course that takes someone from the 2017 paper "Attention Is All You Need" to the June-2026 AI frontier (reasoning models, multimodal, agents, MCP).

Your job is to hand-hold this individual learner through the whole journey:
- Meet them where they are. Use their background, goals, and journey (provided below) to personalise everything.
- Teach with stories and analogies, then check understanding. Be warm, encouraging, and concrete — never a wall of jargon.
- When useful, GIVE THEM MATERIALS AND SCENARIOS: worked examples, a small exercise, a real-world scenario to reason through, or a tiny code snippet. Make learning active.
- Always end by pointing to the single best next step for THEM: which day/topic to do next and why, based on where the cohort is and what they've completed.
- If they seem stuck, confused, or explicitly want a person, gently let them know they can tap "Raise human help" to bring in a human trainer — don't overuse this; try to help first.

Keep replies focused and readable: lead with the answer, use short paragraphs and the occasional list. Avoid preamble like "Great question!". Ground what you say in the retrieved course passages when they're relevant; if something is outside the course, say so briefly and still help.`;

async function buildSystem(learner: Learner, currentDay: number, completedDays: number[], latestUserMsg: string): Promise<string> {
  return `${PERSONA}\n\n---\n${await assembleCoachContext(learner, currentDay, completedDays, latestUserMsg)}`;
}

function toApiMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Streams the coach's reply as text chunks. Falls back to a helpful mock when
 * ANTHROPIC_API_KEY is not set, so the whole flow is runnable with zero config.
 */
export async function* streamCoachReply(
  learner: Learner,
  currentDay: number,
  completedDays: number[],
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const latest = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  if (!hasClaudeKey()) {
    yield* mockReply(learner, latest, currentDay);
    return;
  }

  const system = await buildSystem(learner, currentDay, completedDays, latest);
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 4000,
    system,
    messages: toApiMessages(messages),
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

/** One-shot personalised "what should I learn next" recommendation. Kept fast (no extended thinking). */
export async function recommendNext(learner: Learner, currentDay: number, completedDays: number[]): Promise<string> {
  const ask =
    "Based on my profile, my journey so far, and where the cohort is, tell me exactly what I should focus on next and why. " +
    "Give me 1 concrete next topic, 1 short exercise or scenario to try, and 1 thing to watch for in the 2026 market. Keep it tight.";

  if (!hasClaudeKey()) {
    return mockRecommendation(learner, currentDay);
  }

  const system = await buildSystem(learner, currentDay, completedDays, ask);
  // No extended thinking here on purpose — this is a short, snappy suggestion, so we
  // skip the deliberation latency and cap tokens to keep it responsive.
  const res = await client().messages.create({
    model: process.env.RECOMMEND_MODEL || MODEL,
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: ask }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Turns a learner's capstone description into a clear, professional ONE-PAGE
 * summary that any evaluating organization can read to understand exactly what
 * the candidate built. Third-person, evaluator-facing. Mock fallback if no key.
 */
export async function polishCapstone(learner: Learner, title: string, raw: string): Promise<string> {
  if (!hasClaudeKey()) {
    return (
      `**${title}**\n\n` +
      `${learner.name} completed the 20-day Tensorpath program and built the following capstone:\n\n` +
      `${raw}\n\n` +
      `*(This summary is shown as submitted — configure ANTHROPIC_API_KEY to auto-generate a polished evaluator-facing one-pager.)*`
    );
  }
  const system =
    `You write the official one-page capstone summary printed on a verifiable certificate of completion for the "Tensorpath" program ` +
    `(a 20-day course from the 2017 "Attention Is All You Need" paper to the 2026 frontier: transformers, RAG, fine-tuning, agents, multimodal, reasoning models). ` +
    `An external organization (an employer or admissions committee) will read this to evaluate the candidate, so it must be clear, concrete, and credible — NOT marketing fluff.\n\n` +
    `Write in the THIRD PERSON about ${learner.name}. Produce ABOUT ONE PAGE of markdown with these sections:\n` +
    `## Project — a one-line description of what was built\n` +
    `## Problem & context — what real problem it addresses\n` +
    `## What ${learner.name.split(" ")[0]} built — the actual product/system, concretely\n` +
    `## Approach & AI techniques — which concepts from the course were applied (name them)\n` +
    `## Outcome & skills demonstrated — what works, and the competencies it evidences\n\n` +
    `Be specific and grounded ONLY in what the learner describes; do not invent features or metrics. If the description is thin, summarise honestly and note scope. Keep to ~400-550 words.`;
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: `Capstone title: ${title}\n\nMy description of what I built:\n${raw}\n\nMy background: ${learner.background || "n/a"}. My goal: ${learner.goals || "n/a"}.` }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Mock fallback (no API key) — keeps the product fully demoable
// ---------------------------------------------------------------------------

async function* mockReply(learner: Learner, latest: string, currentDay: number): AsyncGenerator<string> {
  const text =
    `*(Demo coach — set ANTHROPIC_API_KEY for the real Claude-powered coach.)*\n\n` +
    `Hi ${learner.name || "there"}! You asked: "${latest}".\n\n` +
    `Here's how I'd guide you: the cohort is on **Day ${currentDay}**, and given your goal of "${learner.goals || "learning AI"}", ` +
    `the best next move is to make sure the Day ${currentDay} ideas feel intuitive before moving on. ` +
    `Try this scenario: explain today's concept to a friend in 3 sentences using an everyday analogy — if you can, you've got it.\n\n` +
    `When you want a human to walk you through anything, tap **Raise human help** below.`;
  for (const part of text.split(/(\s+)/)) {
    yield part;
    await new Promise((r) => setTimeout(r, 8));
  }
}

function mockRecommendation(learner: Learner, currentDay: number): string {
  return (
    `**Next topic:** Day ${currentDay} of the course — make sure its core idea is solid before advancing.\n\n` +
    `**Try this:** write a 3-sentence explanation of today's concept for a non-technical friend.\n\n` +
    `**2026 watch:** notice how this idea shows up in the agentic/MCP tools dominating the market right now.\n\n` +
    `*(Demo recommendation — set ANTHROPIC_API_KEY for fully personalised, Claude-powered guidance.)*\n\n` +
    `_Course map:_\n${courseOverview()}`
  );
}
