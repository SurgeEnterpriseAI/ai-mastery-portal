"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import Paywall from "@/components/Paywall";

interface Initial {
  learner: {
    name: string; email: string; background: string; goals: string; level: string;
    paid: boolean; plan: string;
    journey: { id: string; type: string; summary: string; at: string }[];
  };
  gate: { locked: boolean; used: number; limit: number; remaining: number | null };
  progress: { currentDay: number; completedDays: number[] };
  totalDays: number;
  cohortName: string;
  sessions: { id: string; title: string; updatedAt: string; count: number }[];
  tickets: { id: string; question: string; status: string; response?: string; createdAt: string }[];
  claudeConfigured: boolean;
  payConfigured: boolean;
  price: number;
  currency: number | string;
}

export default function LearnDashboard({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { learner, gate, progress, totalDays, sessions, tickets, claudeConfigured, payConfigured, price, currency } = initial;

  const [paywall, setPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const pct = Math.round((progress.completedDays.length / totalDays) * 100);

  async function startSession() {
    setBusy(true);
    const res = await fetch("/api/coach/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setBusy(false);
    if (res.status === 402) {
      const d = await res.json();
      setPaywallReason(d.message || "");
      setPaywall(true);
      return;
    }
    const d = await res.json();
    if (res.ok) router.push(`/learn/coach?s=${d.sessionId}`);
  }

  async function getRecommendation() {
    setRecLoading(true);
    setRec("");
    const res = await fetch("/api/coach/recommend", { method: "POST" });
    const d = await res.json();
    setRecLoading(false);
    setRec(res.ok ? d.recommendation : d.error || "Could not get a recommendation.");
  }

  async function logout() {
    await fetch("/api/learner/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Paywall
        open={paywall}
        onClose={() => setPaywall(false)}
        onUnlocked={() => { setPaywall(false); router.refresh(); }}
        price={price}
        currency={String(currency)}
        payConfigured={payConfigured}
        reason={paywallReason}
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-2xl">🎓</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-400">Your AI journey</div>
            <div className="text-lg font-bold text-white">Hi {learner.name.split(" ")[0]} 👋</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {learner.paid ? (
            <span className="rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-bold text-emerald-300">PRO · unlimited</span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
              {gate.remaining ?? 0} free session{gate.remaining === 1 ? "" : "s"} left
            </span>
          )}
          <button onClick={logout} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">Log out</button>
        </div>
      </header>

      {/* Coach hero */}
      <section className="mt-8 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/20 to-panel/60 p-6">
        <div className="text-xs uppercase tracking-widest text-brand-300">Your personal AI coach</div>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Aria is ready to hand-hold your learning.</h1>
        <p className="mt-2 max-w-2xl text-gray-300">
          Ask anything, get scenarios and materials, and find out exactly what to learn next — personalised to your goal
          of <strong className="text-white">{learner.goals || "mastering AI"}</strong>. The cohort is on{" "}
          <strong className="text-white">Day {progress.currentDay}</strong>.
        </p>
        {!claudeConfigured && (
          <p className="mt-3 inline-block rounded-lg bg-amber-600/15 px-3 py-1.5 text-xs text-amber-300">
            Demo coach active — set <code>ANTHROPIC_API_KEY</code> for the full Claude-powered coach.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={startSession} disabled={busy} className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">
            {busy ? "Starting…" : "✨ Start a coaching session"}
          </button>
          <button onClick={getRecommendation} disabled={recLoading} className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-60">
            {recLoading ? "Thinking…" : "🧭 What should I learn next?"}
          </button>
        </div>
        {rec && (
          <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">🧭 Your personalised next step</div>
            <Markdown className="prose-slide prose-compact mt-2 text-sm text-gray-100">{rec}</Markdown>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Past sessions */}
        <section className="rounded-2xl border border-white/10 bg-panel/60 p-6">
          <h3 className="text-lg font-bold text-white">💬 Your coaching sessions</h3>
          <p className="mt-0.5 text-sm text-gray-400">Pick up any conversation where you left off.</p>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {sessions.length === 0 && <p className="text-sm text-gray-500">No sessions yet — start your first one above.</p>}
            {sessions.map((s) => (
              <Link key={s.id} href={`/learn/coach?s=${s.id}`} className="block rounded-lg border border-white/10 bg-black/20 px-3 py-2 hover:border-brand-500/50">
                <div className="text-sm font-medium text-white">{s.title}</div>
                <div className="text-xs text-gray-400">{s.count} messages · {new Date(s.updatedAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Progress + journey */}
        <section className="rounded-2xl border border-white/10 bg-panel/60 p-6">
          <h3 className="text-lg font-bold text-white">📈 Your journey</h3>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-sm text-gray-400">{progress.completedDays.length} of {totalDays} days completed by the cohort</div>
          <div className="mt-4 max-h-52 space-y-1.5 overflow-y-auto">
            {learner.journey.map((e) => (
              <div key={e.id} className="flex gap-2 text-sm">
                <span className="text-brand-400">•</span>
                <span className="text-gray-300">{e.summary}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tickets + profile */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-panel/60 p-6">
          <h3 className="text-lg font-bold text-white">🙋 Your human-help requests</h3>
          <div className="mt-3 space-y-2">
            {tickets.length === 0 && <p className="text-sm text-gray-500">None yet. You can raise one from any coaching session.</p>}
            {tickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{t.question.slice(0, 70)}</span>
                  <span className={`text-xs ${t.status === "resolved" ? "text-emerald-400" : "text-amber-400"}`}>{t.status}</span>
                </div>
                {t.response && <p className="mt-1 text-xs text-gray-300"><strong className="text-gray-200">Trainer:</strong> {t.response}</p>}
              </div>
            ))}
          </div>
        </section>

        <ProfileEditor initial={learner} />
      </div>

      {!learner.paid && (
        <div className="mt-6 rounded-2xl border border-brand-500/30 bg-panel/60 p-5 text-center">
          <p className="text-gray-300">
            You're on the free plan ({gate.used}/{gate.limit} coaching sessions used). Go Pro any time for unlimited coaching.
          </p>
          <button onClick={() => { setPaywallReason("Upgrade whenever you're ready."); setPaywall(true); }} className="mt-3 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-500">
            See Pro
          </button>
        </div>
      )}
    </main>
  );
}

function ProfileEditor({ initial }: { initial: { background: string; goals: string; level: string } }) {
  const [background, setBackground] = useState(initial.background);
  const [goals, setGoals] = useState(initial.goals);
  const [level, setLevel] = useState(initial.level || "beginner");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch("/api/learner/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ background, goals, level }),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const input = "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-brand-500";
  return (
    <section className="rounded-2xl border border-white/10 bg-panel/60 p-6">
      <h3 className="text-lg font-bold text-white">⚙️ Your profile</h3>
      <p className="mt-0.5 text-sm text-gray-400">This shapes how your coach personalises everything.</p>
      <div className="mt-3 space-y-3">
        <textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={2} placeholder="Your background" className={input} />
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} placeholder="Your goal" className={input} />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={input}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button onClick={save} disabled={busy} className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">
          {saved ? "Saved ✓" : busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </section>
  );
}
