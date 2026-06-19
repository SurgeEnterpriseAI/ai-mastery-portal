import type { Learner } from "./types";
import { getAllDayMeta, TOTAL_DAYS } from "./curriculum";

export interface CoachWelcome {
  greeting: string; // supports markdown (bold)
  chips: string[]; // suggested first prompts, already personalised
}

function short(s: string, n = 42): string {
  const t = (s || "").trim();
  return t.length > n ? `${t.slice(0, n - 1).trim()}…` : t;
}

// Turn a day title into a short, chip-sized topic label: strip leading filler
// words and cap the length so chips stay tidy.
// e.g. "How Transformers Learn to Speak" -> "Transformers Learn to Speak"
function topicLabel(title: string): string {
  const t = (title || "").replace(/^(how|the|inside|why|what|when|a|an|from|beyond)\s+/i, "").trim();
  return short(t || title || "this topic", 34);
}

/**
 * Builds a personalised coach welcome from what we already store about the
 * learner — their profile (goal, level), their own completed days, the cohort's
 * current day, and their recent journey. Deterministic and instant (no LLM
 * call), so the hand-holding feels personal the moment they open a session.
 */
export function buildCoachWelcome(learner: Learner, currentDay: number): CoachWelcome {
  const first = (learner.name || "there").split(" ")[0];
  const metas = getAllDayMeta();
  const titleOf = (d: number) => metas.find((m) => m.day === d)?.title || `Day ${d}`;
  const done = [...(learner.completedDays || [])].filter((d) => d >= 1 && d <= TOTAL_DAYS).sort((a, b) => a - b);
  const lastDone = done.length ? done[done.length - 1] : 0;
  const goal = short(learner.goals || "");
  const level = learner.level || "";

  // A level-appropriate "explain" chip we can reuse.
  const explainChip = (topic: string) =>
    level === "advanced" ? `Show me a tricky edge case in ${topic}` :
    level === "intermediate" ? `Go deeper on ${topic}` :
    `Explain ${topic} like I'm five`;

  // Case B — finished the whole program.
  if (lastDone >= TOTAL_DAYS) {
    return {
      greeting: `Hi ${first} 👋 You've completed **all ${TOTAL_DAYS} days** — seriously impressive. Want to prep for your capstone, run an interview-style practice, or revisit any topic before you get placed?`,
      chips: [
        "Help me plan my capstone project",
        "Run a mock AI interview with me",
        goal ? `Which AI roles fit: ${goal}?` : "Which AI roles should I target?",
        "Quiz me across the whole course",
      ],
    };
  }

  // Case A — they've finished at least one day: anchor on what they just did.
  if (lastDone >= 1) {
    const lastTopic = topicLabel(titleOf(lastDone));
    const nextDay = Math.min(lastDone + 1, TOTAL_DAYS);
    const nextTopic = topicLabel(titleOf(nextDay));
    return {
      greeting: `Hi ${first} 👋 Nice work finishing **Day ${lastDone}: ${titleOf(lastDone)}**. Want to lock it in with a practice scenario, clear up anything still fuzzy, or get a head start on **Day ${nextDay}: ${titleOf(nextDay)}**?`,
      chips: [
        `Give me a scenario to practise ${lastTopic}`,
        `Quiz me on ${lastTopic}`,
        `Prep me for Day ${nextDay}: ${nextTopic}`,
        explainChip(lastTopic),
      ],
    };
  }

  // Case C — just starting: anchor on the day the cohort is teaching.
  const day = Math.min(Math.max(currentDay, 1), TOTAL_DAYS);
  const topic = topicLabel(titleOf(day));
  return {
    greeting: `Hi ${first} 👋 You're just getting started — the class is on **Day ${day}: ${titleOf(day)}**. Want me to walk you through ${topic}, set you a quick practice scenario${goal ? `, or map out your path to "${goal}"` : ""}?`,
    chips: [
      `Walk me through Day ${day}: ${topic}`,
      `Give me a scenario to practise ${topic}`,
      goal ? `How do I get to: ${goal}?` : "What should I learn first?",
      explainChip(topic),
    ],
  };
}
