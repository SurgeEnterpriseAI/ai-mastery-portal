import { mutateDB, readDB } from "@/lib/db";
import { getCurrentLearner, ensureProfileEmbedding } from "@/lib/learner";
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

  const db = await readDB();
  const session = db.coachSessions.find((s) => s.id === sessionId && s.learnerId === learner.id);
  if (!session) return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });

  const now = new Date().toISOString();
  const userMsg: ChatMessage = { role: "user", content: text, at: now };
  const history: ChatMessage[] = [...session.messages, userMsg];

  // refresh this learner's persisted profile embedding (per-learner RAG vector)
  const enriched = await ensureProfileEmbedding(learner);

  // persist the user message immediately
  await mutateDB((d) => {
    const s = d.coachSessions.find((x) => x.id === sessionId);
    if (s) {
      s.messages.push(userMsg);
      s.updatedAt = now;
      if (s.messages.length === 1) s.title = text.slice(0, 60);
    }
    const l = d.learners.find((x) => x.id === learner.id);
    if (l) l.journey.push({ id: `jrn-${now}`, type: "asked", summary: `Asked: ${text.slice(0, 80)}`, at: now });
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of streamCoachReply(enriched, db.progress.currentDay, db.progress.completedDays, history)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        const msg = `\n\n_(The coach hit an error: ${(e as Error).message}. Please try again.)_`;
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        const at = new Date().toISOString();
        await mutateDB((d) => {
          const s = d.coachSessions.find((x) => x.id === sessionId);
          if (s) {
            s.messages.push({ role: "assistant", content: full, at });
            s.updatedAt = at;
          }
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
