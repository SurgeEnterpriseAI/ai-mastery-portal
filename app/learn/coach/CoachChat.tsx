"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function CoachChat({
  sessionId,
  title,
  learnerName,
  welcome,
  initialMessages,
}: {
  sessionId: string;
  title: string;
  learnerName: string;
  welcome?: { greeting: string; chips: string[] };
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [help, setHelp] = useState(false);
  const [helpText, setHelpText] = useState("");
  const [toast, setToast] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "The coach is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: `_${(e as Error).message}_` };
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  async function submitHelp() {
    const q = helpText.trim();
    if (!q) return;
    const res = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachSessionId: sessionId, question: q }),
    });
    const d = await res.json().catch(() => ({}));
    setHelp(false);
    setHelpText("");
    setToast(d.message || "Request sent.");
    setTimeout(() => setToast(""), 5000);
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {toast && (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/learn" className="text-slate-500 hover:text-slate-900">←</Link>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-brand-600">🧞 Genie · your learning companion</div>
            <div className="text-sm font-bold text-slate-900">{title}</div>
          </div>
        </div>
        <button
          onClick={() => setHelp(true)}
          className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-400/10"
        >
          🙋 Raise human help
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-5 py-8">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="text-3xl">🧞</div>
            {welcome?.greeting ? (
              <Markdown className="prose-slide prose-compact mx-auto mt-2 max-w-xl text-slate-600">{welcome.greeting}</Markdown>
            ) : (
              <p className="mt-2 text-slate-600">
                Hi {learnerName.split(" ")[0]}! I'm Genie, your learning companion. Ask me anything about the course, request a
                scenario to practise, or tell me where you feel stuck.
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(welcome?.chips?.length ? welcome.chips : ["Explain attention like I'm five", "Give me a scenario to practise RAG", "What should I learn next?"]).map((s) => (
                <button key={s} onClick={() => setInput(s)} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              I&rsquo;m here whenever you need me. If I can&rsquo;t help, tap{" "}
              <button onClick={() => setHelp(true)} className="font-semibold text-amber-700 underline hover:text-amber-800">🙋 Raise human help</button>{" "}
              and your human trainer will step in.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-white"
                  : "max-w-[90%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3"
              }
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : m.content ? (
                <Markdown className="prose-slide prose-compact text-slate-800">{m.content}</Markdown>
              ) : (
                <span className="inline-flex gap-1 text-slate-500">
                  <span className="animate-pulse">Genie is thinking</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </main>

      <footer className="sticky bottom-0 border-t border-slate-200 bg-slate-100 px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask Genie anything… (Enter to send, Shift+Enter for a new line)"
            className="max-h-40 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand-500"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </footer>

      {help && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">🙋 Bring in a human</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tell us what you'd like a human trainer to explain. They'll see the recent conversation and reach out.
            </p>
            <textarea
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              rows={4}
              placeholder="e.g. I still don't get why self-attention beats RNNs — can someone walk me through it?"
              className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-brand-500"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setHelp(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={submitHelp} disabled={!helpText.trim()} className="flex-1 rounded-lg bg-amber-600 py-2 font-semibold text-white hover:bg-amber-500 disabled:opacity-50">
                Request human help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
