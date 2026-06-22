"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import Paywall from "@/components/Paywall";
import Tour from "@/components/Tour";
import InnovationsCarousel from "@/components/InnovationsCarousel";
import innovations from "@/content/innovations.json";

const LEARN_STEPS = [
  { title: "Welcome to your AI journey 🎓", body: "Your program is live, instructor-led training — with an AI coach to support you between classes. Here's how it works." },
  { target: '[data-tour="ld-live"]', title: "1. Your live class comes first", body: "Each day your trainer teaches live, right here in the portal — video, screen-share and chat. Tap here to join when class is on. This is the main event." },
  { target: '[data-tour="ld-start"]', title: "2. Your AI coach, between classes", body: "Between live classes, open Genie to reinforce what your trainer covered — ask anything, request practice scenarios, and get hand-held through each topic." },
  { target: '[data-tour="ld-recommend"]', title: "3. Not sure what to review?", body: "Get a personalised next step based on your goal and progress — Genie tells you exactly what to focus on next." },
  { target: '[data-tour="ld-curriculum"]', title: "4. Review each day & earn your certificate", body: "After your trainer teaches a day, open it here to go through the material — that marks it done. Finish all 20 plus your capstone to claim a publicly verifiable certificate. (Inside any coaching session you can also 'Raise human help'.)" },
];

function prettyDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

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
  batch: { status: string | null; cohortName: string | null; startDate: string | null; classTime: string | null; sessions: number; sessionDates: string[] };
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

  // Live-class schedule, derived from the learner's batch (dates are YYYY-MM-DD).
  const todayStr = new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
  const sortedSessions = [...(batch.sessionDates || [])].sort();
  const classToday = sortedSessions.includes(todayStr);
  const nextSession = sortedSessions.find((d) => d >= todayStr) || null;
  const sessionsLeft = sortedSessions.filter((d) => d >= todayStr).length;
  const currentDayMeta = dayMetas.find((d) => d.day === progress.currentDay);

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
  const [videoDay, setVideoDay] = useState<number | null>(null);
  const pad2 = (n: number) => String(n).padStart(2, "0");
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
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">🎓 Free program</span>
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
          <h2 className="mt-1 text-lg font-bold text-slate-900">You&rsquo;re approved for {batch.cohortName || "your batch"}{batch.startDate ? ` — starts ${batch.startDate}` : ""}{batch.classTime ? ` at ${batch.classTime}` : ""}</h2>
          <p className="mt-1 text-sm text-slate-600">{batch.sessions > 0 ? `${batch.sessions} live sessions, taught in-portal` : "Live classes, taught in-portal"} — video, screen-share and chat. Please confirm your seat so your trainer knows you&rsquo;re coming.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => confirmBatch("confirm")} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">✓ Confirm my seat</button>
            <button onClick={() => confirmBatch("decline")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Can&rsquo;t make it</button>
          </div>
        </div>
      )}
      {batchStatus === "confirmed" && batch.cohortName && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ Seat confirmed for <strong>{batch.cohortName}</strong>{batch.startDate ? ` (starts ${batch.startDate})` : ""}{batch.classTime ? ` · ${batch.classTime}` : ""}. When class starts, tap <strong>🔴 Join live class</strong> above.
        </div>
      )}

      {/* Batch complete → in-person job help at the Surge Bengaluru office */}
      {completed.length >= totalDays && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">You finished all {totalDays} days 🎉</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Next step: come to the Surge office in Bengaluru.</h2>
          <p className="mt-1 text-sm text-slate-600">First, claim your certificate. Then visit our <strong>Surge Bengaluru office</strong> for hands-on job help — résumé &amp; marketing, mock interviews and interview prep, and placement support, one-on-one with our team.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/learn/certificate" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">🎓 Capstone &amp; certificate</Link>
            <Link href="/enquiry" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">📍 Book your office visit</Link>
          </div>
        </div>
      )}

      {/* PRIMARY: Live instructor-led training — the main event */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-brand-700/20 bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-card">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-100">
          <span className="inline-flex h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Live instructor-led training
        </div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">Your trainer teaches you live — this is your main class.</h1>
        <p className="mt-2 max-w-2xl text-brand-50">
          Every session, your expert trainer teaches live right here in the portal — video, screen-share and chat.
          {classToday ? (
            <> <strong className="text-white">There&rsquo;s a live class today{batch.classTime ? ` at ${batch.classTime}` : ""}.</strong></>
          ) : nextSession ? (
            <> Your next live class is <strong className="text-white">{prettyDate(nextSession)}{batch.classTime ? ` at ${batch.classTime}` : ""}</strong>.</>
          ) : null}{" "}
          The cohort is on <strong className="text-white">Day {progress.currentDay}{currentDayMeta ? `: ${currentDayMeta.title}` : ""}</strong>.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link data-tour="ld-live" href="/class/live" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-brand-700 transition hover:bg-brand-50">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> Join your live class
          </Link>
          <Link href={`/present/${progress.currentDay}`} onClick={() => markReviewed(progress.currentDay)} className="rounded-lg border border-white/40 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20">
            📖 Open today&rsquo;s lesson (Day {progress.currentDay})
          </Link>
        </div>
        {sortedSessions.length > 0 && (
          <p className="mt-4 text-xs text-brand-100">
            {batch.cohortName ? `${batch.cohortName} · ` : ""}{sessionsLeft} of {sortedSessions.length} live sessions remaining{nextSession && !classToday ? ` · next on ${prettyDate(nextSession)}` : ""}.
          </p>
        )}
      </section>

      {/* What to do — the daily rhythm of the program */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">How to follow your program</h2>
        <p className="mt-0.5 text-sm text-slate-500">Your live class is the main event each day. Here&rsquo;s the loop that gets you trained, certified and placed.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RhythmCard n="1" tone="red" title="Attend the live class" body="Join in-portal when your trainer goes live — ask questions in chat and follow the screen-share. Don't miss it." href="/class/live" cta="Join live class" />
          <RhythmCard n="2" tone="brand" title="Review the day's material" body="Open the day your trainer just taught to revisit the slides — that marks the day done." href={`/present/${progress.currentDay}`} cta={`Open Day ${progress.currentDay}`} onClick={() => markReviewed(progress.currentDay)} />
          <RhythmCard n="3" tone="accent" title="Genie, your companion — anytime" body="Stuck or curious between classes? Reach Genie for help and practice — and it brings in a human trainer if needed." href="#ai-coach" cta="Meet Genie" />
          <RhythmCard n="4" tone="emerald" title="Capstone → certified → job help" body="Finish your capstone for a verifiable certificate, then visit the Surge Bengaluru office for interview prep, marketing & placement help." href="/learn/certificate" cta="Capstone & certificate" />
        </div>
      </section>

      {/* SECONDARY: Genie — the student's always-on learning companion */}
      <section id="ai-coach" className="mt-6 scroll-mt-6 overflow-hidden rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl shadow-card">🧞</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Meet Genie, your learning companion</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> always here
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-slate-600">
              Hi {learner.name.split(" ")[0]} 👋 I&rsquo;m <strong className="text-slate-900">Genie</strong>, and I&rsquo;m by your side for the
              whole journey. Stuck on something your trainer covered, curious to go deeper, or want a scenario to
              practise — just reach me, <strong className="text-slate-900">anytime</strong>. And if I can&rsquo;t crack it for you,
              I&rsquo;ll bring in your <strong className="text-slate-900">human trainer</strong> to help. You&rsquo;re never on your own.
            </p>
          </div>
        </div>
        {!claudeConfigured && (
          <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            Demo coach active — set <code>ANTHROPIC_API_KEY</code> for the full Claude-powered companion.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button data-tour="ld-start" onClick={startSession} disabled={busy} className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Opening…" : "💬 Reach Genie — ask anything"}
          </button>
          <button data-tour="ld-recommend" onClick={getRecommendation} disabled={recLoading} className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {recLoading ? "Thinking…" : "🧭 What should I learn next?"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Genie knows your goal of <strong className="text-slate-500">{learner.goals || "mastering AI"}</strong> and exactly where you are — every reply is personalised to you.</p>
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
            <p className="mt-0.5 text-sm text-slate-500">Your trainer teaches each day live — open a day to go through the material, or tap <strong className="text-slate-700">▶ Explainer</strong> for a full narrated video of that day. Opening a day marks it done.</p>
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
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-600">Day {d.day}</div>
                  <Link href={`/present/${d.day}`} onClick={() => markReviewed(d.day)} className="block truncate text-sm font-semibold text-slate-900 hover:text-accent-700">{d.title}</Link>
                  <button onClick={() => setVideoDay(d.day)} className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50">
                    ▶ Explainer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <InnovationsCarousel items={innovations.items} updatedAt={innovations.updatedAt} />

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

      {videoDay !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-4" onClick={() => setVideoDay(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-600">Day {videoDay} · explainer</div>
                <div className="truncate text-sm font-bold text-slate-900">{dayMetas.find((m) => m.day === videoDay)?.title}</div>
              </div>
              <button onClick={() => setVideoDay(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">✕ Close</button>
            </div>
            <video
              key={videoDay}
              className="aspect-video w-full bg-slate-900"
              controls
              autoPlay
              playsInline
              preload="metadata"
              poster={`/day-videos/day-${pad2(videoDay)}.png`}
            >
              <source src={`/day-videos/day-${pad2(videoDay)}.mp4`} type="video/mp4" />
            </video>
            <p className="px-5 py-3 text-xs text-slate-500">A full narrated walkthrough of Day {videoDay}, grounded in the course and today&rsquo;s AI market. Watch any time to reinforce the live class.</p>
          </div>
        </div>
      )}
    </main>
  );
}

function RhythmCard({ n, tone, title, body, href, cta, onClick }: { n: string; tone: "red" | "brand" | "accent" | "emerald"; title: string; body: string; href: string; cta: string; onClick?: () => void }) {
  const badge: Record<string, string> = { red: "bg-red-600", brand: "bg-brand-600", accent: "bg-accent-600", emerald: "bg-emerald-600" };
  const link: Record<string, string> = {
    red: "border-red-100 bg-red-50 text-red-700 hover:bg-red-100",
    brand: "border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100",
    accent: "border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-200",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };
  const cls = `mt-3 inline-block rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${link[tone]}`;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white ${badge[tone]}`}>{n}</div>
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{body}</p>
      {href.startsWith("#") ? (
        <a href={href} className={cls}>{cta} →</a>
      ) : (
        <Link href={href} onClick={onClick} className={cls}>{cta} →</Link>
      )}
    </div>
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
      <ChangePassword />
    </section>
  );
}

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-brand-500";

  async function change() {
    setMsg("");
    if (next.length < 8) { setMsg("New password must be at least 8 characters."); return; }
    setBusy(true);
    const res = await fetch("/api/learner/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setMsg("✓ Password updated."); setCur(""); setNext(""); }
    else setMsg(d.error || "Could not change password.");
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-semibold text-brand-600 hover:underline">🔒 Change password</button>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-700">Change password</div>
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" className={input} />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (min 8 chars)" className={input} />
          {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>{msg}</p>}
          <div className="flex gap-2">
            <button onClick={change} disabled={busy || !cur || !next} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : "Update password"}</button>
            <button onClick={() => { setOpen(false); setMsg(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
