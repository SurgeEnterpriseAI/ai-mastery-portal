import { getCurrentLearner, ensureProfileEmbedding, pushJourney } from "@/lib/learner";
import { getCoachSession, getAppState, appendMessage, setSessionTitle } from "@/lib/data";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { streamCoachReply } from "@/lib/claude";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel: 60s is the Hobby ceiling; Pro can raise this

export async function POST(req: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rl = await rateLimit(`chat:${learner.id}`, 30, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { sessionId, message } = await req.json().catch(() => ({}));
  const text = String(message || "").trim();
  if (!sessionId || !text) return new Response(JSON.stringify({ error: "sessionId and message required" }), { status: 400 });

  const session = await getCoachSession(sessionId, learner.id);
  if (!session) return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });

  const userMsg: ChatMessage = { role: "user", content: text, at: new Date().toISOString() };
  const history: ChatMessage[] = [...session.messages, userMsg];
  const isFirst = session.messages.length === 0;

  // refresh this learner's persisted profile embedding (per-learner RAG vector)
  const enriched = await ensureProfileEmbedding(learner);
  const { progress } = await getAppState();

  // persist the user message + journey immediately (each is its own row insert)
  await appendMessage(sessionId, "user", text);
  if (isFirst) await setSessionTitle(sessionId, text.slice(0, 60));
  await pushJourney(learner.id, { type: "asked", summary: `Asked: ${text.slice(0, 80)}` });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of streamCoachReply(enriched, progress.currentDay, progress.completedDays, history)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        const msg = `\n\n_(The coach hit an error: ${(e as Error).message}. Please try again.)_`;
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        try {
          await appendMessage(sessionId, "assistant", full);
        } catch (e) {
          console.error("[coach/chat] failed to persist assistant message:", (e as Error).message);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
