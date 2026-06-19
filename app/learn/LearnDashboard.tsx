"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import Paywall from "@/components/Paywall";
import Tour from "@/components/Tour";

const LEARN_STEPS = [
  { title: "Welcome to your AI journey 🎓", body: "Your trainer teaches each day live. Between classes, here's how to keep learning. Three quick stops." },
  { target: '[data-tour="ld-start"]', title: "1. Your AI coach between classes", body: "Tap here to open Aria, your personal coach. She reinforces what your trainer covered — ask anything, request practice scenarios, and get hand-held through each topic." },
  { target: '[data-tour="ld-recommend"]', title: "2. Not sure what to review?", body: "Get a personalised next step based on your goal and progress — Aria tells you exactly what to focus on next." },
  { target: '[data-tour="ld-curriculum"]', title: "3. Review each day & earn your certificate", body: "After your trainer teaches a day, open it here to go through the material — that marks it done. Finish all 20 to claim a publicly verifiable certificate. (Inside any coaching session you can also 'Raise human help'.)" },
];

interface Initial {
  learner: {
    name: string; email: string; background: string; goals: string; level: string;
    paid: boolean; plan: string;
    completedDays: number[];
    journey: { id: string; type: string; summary: string; at: string }[];
  };
  dayMetas: { day: number; title: string; subtitle: string }[];
  gate: { locked: boolean; used: number; limit: number; remaining: number | null };
  progress: { currentDay: number; completedDays: number[] };
  totalDays: number;
  cohortName: string;
  batch: { status: string | null; cohortName: string | null; startDate: string | null; sessions: number };
  sessions: { id: string; title: string; updatedAt: string; count: number }[];
  tickets: { id: string; question: string; status: string; response?: string; createdAt: string }[];
  claudeConfigured: boolean;
  payConfigured: boolean;
  price: number;
  currency: number | string;
}

export default function LearnDashboard({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { learner, gate, progress, totalDays, sessions, tickets, claudeConfigured, payConfigured, price, currency, dayMetas, batch } = initial;

  const [batchStatus, setBatchStatus] = useState<string | null>(batch.status);
  async function confirmBatch(action: "confirm" | "decline") {
    setBatchStatus(action === "confirm" ? "confirmed" : "declined");
    await fetch("/api/learner/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    router.refresh();
  }

  const [completed, setCompleted] = useState<number[]>(learner.completedDays);
  const myPct = Math.round((completed.length / totalDays) * 100);

  async function toggleDay(day: number, done: boolean) {
    setCompleted((c) => (done ? [...c, day].sort((a, b) => a - b) : c.filter((d) => d !== day)));
    await fetch("/api/learner/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, done }),
    });
    router.refresh();
  }

  // Going through a day's material counts as completing it — mark it done (fire-and-forget,
  // so the click can navigate straight to the material without waiting on the request).
  function markReviewed(day: number) {
    if (completed.includes(day)) return;
    setCompleted((c) => [...c, day].sort((a, b) => a - b));
    fetch("/api/learner/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, done: true }),
    }).catch(() => {});
  }

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
      <Tour steps={LEARN_STEPS} storageKey="learn" />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🎓</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600">Your AI journey</div>
            <div className="text-lg font-bold text-slate-900">Hi {learner.name.split(" ")[0]} 👋</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {learner.paid ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">PRO · unlimited</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {gate.remaining ?? 0} free session{gate.remaining === 1 ? "" : "s"} left
            </span>
          )}
          <Link href="/class/live" className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">🔴 Join live class</Link>
          <Link href="/library" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">🎬 Library</Link>
          <Link href="/careers" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">💼 Careers</Link>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Log out</button>
        </div>
      </header>

      {/* Batch seat confirmation (#4) */}
      {batchStatus === "invited" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Batch invite — action needed</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">You&rsquo;re approved for {batch.cohortName || "your batch"}{batch.startDate ? ` — starts ${batch.startDate}` : ""}</h2>
          <p className="mt-1 text-sm text-slate-600">{batch.sessions > 0 ? `${batch.sessions} live sessions, taught in-portal` : "Live classes, taught in-portal"} — video, screen-share and chat. Please confirm your seat so your trainer knows you&rsquo;re coming.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => confirmBatch("confirm")} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">✓ Confirm my seat</button>
            <button onClick={() => confirmBatch("decline")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Can&rsquo;t make it</button>
          </div>
        </div>
      )}
      {batchStatus === "confirmed" && batch.cohortName && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ Seat confirmed for <strong>{batch.cohortName}</strong>{batch.startDate ? ` (starts ${batch.startDate})` : ""}. When class starts, tap <strong>🔴 Join live class</strong> above.
        </div>
      )}

      {/* Batch complete → get placed (#8) */}
      {completed.length >= totalDays && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">You finished all {totalDays} days 🎉</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Now let&rsquo;s get you placed.</h2>
          <p className="mt-1 text-sm text-slate-600">Claim your certificate, then explore live AI openings and interview prep — your shareable placement profile goes to hiring partners.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/learn/certificate" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">🎓 Capstone & certificate</Link>
            <Link href="/careers" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">💼 Live openings</Link>
            <Link href="/library" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">🎬 Interview prep</Link>
          </div>
        </div>
      )}

      {/* Coach hero */}
      <section className="mt-8 rounded-2xl bg-brand-50 border border-brand-100 p-6">
        <div className="text-xs uppercase tracking-widest text-brand-700">Your personal AI coach</div>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Aria is ready to hand-hold your learning.</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Your trainer teaches each day live. Between classes, ask Aria anything, get scenarios and materials, and find
          out exactly what to review next — personalised to your goal of{" "}
          <strong className="text-slate-900">{learner.goals || "mastering AI"}</strong>. The cohort is on{" "}
          <strong className="text-slate-900">Day {progress.currentDay}</strong>.
        </p>
        {!claudeConfigured && (
          <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            Demo coach active — set <code>ANTHROPIC_API_KEY</code> for the full Claude-powered coach.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button data-tour="ld-start" onClick={startSession} disabled={busy} className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Starting…" : "✨ Start a coaching session"}
          </button>
          <button data-tour="ld-recommend" onClick={getRecommendation} disabled={recLoading} className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {recLoading ? "Thinking…" : "🧭 What should I learn next?"}
          </button>
        </div>
        {rec && (
          <div className="mt-5 rounded-xl border border-accent-200 bg-accent-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-accent-700">🧭 Your personalised next step</div>
            <Markdown className="prose-slide prose-compact mt-2 text-sm text-slate-800">{rec}</Markdown>
          </div>
        )}
      </section>

      {/* Self-paced curriculum + certificate */}
      <section data-tour="ld-curriculum" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">📚 Your course progress</h3>
            <p className="mt-0.5 text-sm text-slate-500">Your trainer teaches each day live — open a day here to go through the material, which marks it done. You can also tick it yourself.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-slate-900">{completed.length}/{totalDays}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">days done</div>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${myPct}%` }} />
        </div>
        {completed.length >= totalDays && (
          <Link href="/learn/certificate" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
            🎓 Get your certificate
          </Link>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {dayMetas.map((d) => {
            const done = completed.includes(d.day);
            return (
              <div key={d.day} className={`flex items-start gap-3 rounded-lg border p-3 ${done ? "border-emerald-200 bg-emerald-600/5" : "border-slate-200 bg-slate-50"}`}>
                <input type="checkbox" checked={done} onChange={(e) => toggleDay(d.day, e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-600">Day {d.day}</div>
                  <Link href={`/present/${d.day}`} onClick={() => markReviewed(d.day)} className="block truncate text-sm font-semibold text-slate-900 hover:text-accent-700">{d.title}</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Past sessions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">💬 Your coaching sessions</h3>
          <p className="mt-0.5 text-sm text-slate-500">Pick up any conversation where you left off.</p>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {sessions.length === 0 && <p className="text-sm text-slate-400">No sessions yet — start your first one above.</p>}
            {sessions.map((s) => (
              <Link key={s.id} href={`/learn/coach?s=${s.id}`} className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-brand-300">
                <div className="text-sm font-medium text-slate-900">{s.title}</div>
                <div className="text-xs text-slate-500">{s.count} messages · {new Date(s.updatedAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Progress + journey */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">📈 Your journey</h3>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-sm text-slate-500">{progress.completedDays.length} of {totalDays} days completed by the cohort</div>
          <div className="mt-4 max-h-52 space-y-1.5 overflow-y-auto">
            {learner.journey.map((e) => (
              <div key={e.id} className="flex gap-2 text-sm">
                <span className="text-brand-600">•</span>
                <span className="text-slate-600">{e.summary}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tickets + profile */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">🙋 Your human-help requests</h3>
          <div className="mt-3 space-y-2">
            {tickets.length === 0 && <p className="text-sm text-slate-400">None yet. You can raise one from any coaching session.</p>}
            {tickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-900">{t.question.slice(0, 70)}</span>
                  <span className={`text-xs ${t.status === "resolved" ? "text-emerald-700" : "text-amber-700"}`}>{t.status}</span>
                </div>
                {t.response && <p className="mt-1 text-xs text-slate-600"><strong className="text-slate-700">Trainer:</strong> {t.response}</p>}
              </div>
            ))}
          </div>
        </section>

        <ProfileEditor initial={learner} />
      </div>

      {!learner.paid && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-white p-5 text-center">
          <p className="text-slate-600">
            You're on the free plan ({gate.used}/{gate.limit} coaching sessions used). Go Pro any time for unlimited coaching.
          </p>
          <button onClick={() => { setPaywallReason("Upgrade whenever you're ready."); setPaywall(true); }} className="mt-3 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
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

  const input = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-brand-500";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold text-slate-900">⚙️ Your profile</h3>
      <p className="mt-0.5 text-sm text-slate-500">This shapes how your coach personalises everything.</p>
      <div className="mt-3 space-y-3">
        <textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={2} placeholder="Your background" className={input} />
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} placeholder="Your goal" className={input} />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={input}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button onClick={save} disabled={busy} className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {saved ? "Saved ✓" : busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </section>
  );
}
