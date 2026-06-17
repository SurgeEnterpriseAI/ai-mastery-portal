"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Trainee, Session, Progress, OutboxMail, DayMeta } from "@/lib/types";

interface LearnerRow {
  id: string; name: string; email: string; plan: string; paid: boolean;
  handholdingCount: number; goals: string; createdAt: string;
}
interface TicketRow {
  id: string; learnerName: string; learnerEmail: string; question: string;
  context: string; status: string; response?: string; createdAt: string;
}
interface PaymentRow {
  id: string; amount: number; currency: string; status: string; provider: string; createdAt: string;
}

interface InitialData {
  cohortName: string;
  startDate: string | null;
  trainees: Trainee[];
  sessions: Session[];
  progress: Progress;
  outbox: OutboxMail[];
  dayMetas: DayMeta[];
  daysReady: number;
  totalDays: number;
  smtpConfigured: boolean;
  learners: LearnerRow[];
  tickets: TicketRow[];
  payments: PaymentRow[];
}

export default function TrainerDashboard({ initial }: { initial: InitialData }) {
  const router = useRouter();
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    cohortName, trainees, sessions, progress, outbox, dayMetas,
    daysReady, totalDays, smtpConfigured, learners, tickets, payments,
  } = initial;

  const openTickets = tickets.filter((t) => t.status === "open");
  const paidCount = learners.filter((l) => l.paid).length;
  const revenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const [ticketReply, setTicketReply] = useState<Record<string, string>>({});

  const currentDayMeta = dayMetas.find((d) => d.day === progress.currentDay);
  const pct = Math.round((progress.completedDays.length / totalDays) * 100);

  function flash(text: string, ok = true) {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4500);
  }

  async function call(url: string, body?: any, method = "POST") {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash(data.error || "Something went wrong", false);
        return null;
      }
      if (data.message) flash(data.message, true);
      router.refresh();
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // ---- form state ----
  const [traineeName, setTraineeName] = useState("");
  const [traineeEmail, setTraineeEmail] = useState("");
  const [schedDay, setSchedDay] = useState(progress.currentDay);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("18:00");
  const [nameEdit, setNameEdit] = useState(cohortName);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {toast && (
        <div
          className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium shadow-xl ${
            toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-2xl">🧠</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-400">Trainer Console</div>
            <div className="text-lg font-bold text-white">{cohortName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
            Public view
          </Link>
          <button onClick={logout} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
            Log out
          </button>
        </div>
      </header>

      {/* Resume hero */}
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/20 to-panel/60 p-6">
          <div className="text-xs uppercase tracking-widest text-brand-300">Resume teaching</div>
          <h2 className="mt-1 text-2xl font-extrabold text-white">
            Day {progress.currentDay}: {currentDayMeta?.title || "—"}
          </h2>
          <p className="mt-1 text-gray-300">{currentDayMeta?.subtitle}</p>
          <p className="mt-3 text-sm text-gray-400">
            The portal saved your place at <strong className="text-white">slide {progress.currentSlide + 1}</strong>
            {progress.lastTaughtAt
              ? ` · last taught ${new Date(progress.lastTaughtAt).toLocaleString()}`
              : " · not started yet"}
            . Opening the room resumes exactly here.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/present/${progress.currentDay}`}
              className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-500"
            >
              ▶ Start / Resume class
            </Link>
            <button
              onClick={() => call("/api/announce", { day: progress.currentDay })}
              disabled={busy}
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-50"
            >
              📣 Announce &ldquo;what&rsquo;s coming&rdquo; to class
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-panel/60 p-6">
          <div className="text-xs uppercase tracking-widest text-gray-400">Cohort progress</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{pct}%</div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 text-sm text-gray-400">
            {progress.completedDays.length} of {totalDays} days completed
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <Mini label="Trainees" value={`${trainees.length}`} />
            <Mini label="Days ready" value={`${daysReady}/${totalDays}`} />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Schedule */}
        <Panel title="📅 Schedule a session" subtitle="Pick a day, date & time. Then send email invites to the class.">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs uppercase tracking-wider text-gray-400">Day</label>
            <select
              value={schedDay}
              onChange={(e) => setSchedDay(Number(e.target.value))}
              className="col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            >
              {dayMetas.map((d) => (
                <option key={d.day} value={d.day}>
                  Day {d.day} — {d.title}
                </option>
              ))}
            </select>
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400">Date</label>
              <input
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400">Time</label>
              <input
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!schedDate) return flash("Pick a date first", false);
              await call("/api/sessions", { day: schedDay, date: schedDate, time: schedTime });
            }}
            disabled={busy}
            className="mt-3 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            + Schedule session
          </button>

          <div className="mt-4 space-y-2">
            {sessions.length === 0 && <p className="text-sm text-gray-500">No sessions scheduled yet.</p>}
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Day {s.day}: {s.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {s.date} @ {s.time} ·{" "}
                    <span className={s.status === "completed" ? "text-emerald-400" : "text-amber-400"}>{s.status}</span>
                    {s.invitesSent && <span className="text-brand-300"> · invited</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => call("/api/sessions/invite", { id: s.id })}
                    disabled={busy}
                    className="rounded-md bg-brand-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                  >
                    {s.invitesSent ? "Re-send invites" : "Send invites"}
                  </button>
                  <button
                    onClick={() => call(`/api/sessions?id=${s.id}`, undefined, "DELETE")}
                    disabled={busy}
                    className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-gray-400 hover:bg-white/5"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Trainees */}
        <Panel title="👥 Trainees" subtitle="Add learners one by one, or paste many emails (comma / newline separated).">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Name (optional)"
              value={traineeName}
              onChange={(e) => setTraineeName(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
            <input
              placeholder="email@domain.com"
              value={traineeEmail}
              onChange={(e) => setTraineeEmail(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
          </div>
          <button
            onClick={async () => {
              if (!traineeEmail.trim()) return flash("Enter an email", false);
              const data = await call("/api/trainees", { name: traineeName, email: traineeEmail });
              if (data) {
                setTraineeName("");
                setTraineeEmail("");
              }
            }}
            disabled={busy}
            className="mt-3 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            + Add trainee(s)
          </button>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {trainees.length === 0 && <p className="text-sm text-gray-500">No trainees yet.</p>}
            {trainees.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.email}</div>
                </div>
                <button
                  onClick={() => call(`/api/trainees?id=${t.id}`, undefined, "DELETE")}
                  disabled={busy}
                  className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-gray-400 hover:bg-white/5"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Curriculum browser */}
      <section className="mt-8">
        <h3 className="text-lg font-bold text-white">📚 Curriculum — 20 days</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dayMetas.map((d) => {
            const done = progress.completedDays.includes(d.day);
            const current = d.day === progress.currentDay;
            return (
              <Link
                key={d.day}
                href={`/present/${d.day}`}
                className={`rounded-xl border p-4 transition hover:border-brand-500/60 ${
                  current ? "border-brand-500/70 bg-brand-600/10" : "border-white/10 bg-panel/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Day {d.day}</span>
                  {done ? (
                    <span className="text-xs text-emerald-400">✓ done</span>
                  ) : current ? (
                    <span className="text-xs text-amber-400">▶ next</span>
                  ) : d.slideCount === 0 ? (
                    <span className="text-xs text-gray-500">loading…</span>
                  ) : (
                    <span className="text-xs text-gray-500">{d.slideCount} slides</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-white">{d.title}</div>
                <div className="mt-0.5 text-xs text-gray-400 line-clamp-2">{d.subtitle}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Settings + Outbox */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="⚙️ Cohort settings" subtitle="Rename the cohort. Email delivery status below.">
          <div className="flex gap-2">
            <input
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
            <button
              onClick={() => call("/api/cohort", { cohortName: nameEdit })}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              Save
            </button>
          </div>
          <div className={`mt-4 rounded-lg p-3 text-sm ${smtpConfigured ? "bg-emerald-600/15 text-emerald-300" : "bg-amber-600/15 text-amber-300"}`}>
            {smtpConfigured ? (
              <>✓ SMTP configured — invites & announcements are delivered by email.</>
            ) : (
              <>
                ⚠ SMTP not configured. Emails are saved to the <strong>Outbox</strong> below so everything is testable.
                Set <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> (and optionally{" "}
                <code>SMTP_PORT</code>, <code>SMTP_FROM</code>) in <code>.env.local</code> to deliver for real.
              </>
            )}
          </div>
          <button
            onClick={() => call("/api/test-email", {})}
            disabled={busy}
            className="mt-3 w-full rounded-lg border border-white/10 py-2 text-sm text-gray-200 hover:bg-white/5 disabled:opacity-50"
          >
            Send a test email
          </button>
        </Panel>

        <Panel title="📨 Outbox" subtitle="Every invite, announcement & test — most recent first.">
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {outbox.length === 0 && <p className="text-sm text-gray-500">Nothing sent yet.</p>}
            {outbox.map((m) => (
              <div key={m.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{m.subject}</span>
                  <span className={`text-xs ${m.delivered ? "text-emerald-400" : "text-amber-400"}`}>
                    {m.delivered ? "delivered" : "outbox"}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  to {m.to.length} · {new Date(m.sentAt).toLocaleString()} · {m.kind}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Learners + payments */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-lg font-bold text-white">🎓 Learners (self-service AI coaching)</h3>
          <div className="flex gap-3 text-sm">
            <span className="rounded-lg bg-black/30 px-3 py-1.5 text-gray-300">{learners.length} learners</span>
            <span className="rounded-lg bg-black/30 px-3 py-1.5 text-emerald-300">{paidCount} Pro</span>
            <span className="rounded-lg bg-black/30 px-3 py-1.5 text-accent">₹{(revenue / 100).toLocaleString()} revenue</span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-panel/60">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-gray-400">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">Coaching used</th>
                <th className="px-4 py-3">Plan</th>
              </tr>
            </thead>
            <tbody>
              {learners.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-gray-500">No learners yet. Share the <code>/join</code> link.</td></tr>
              )}
              {learners.map((l) => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="px-4 py-3"><div className="font-medium text-white">{l.name}</div><div className="text-xs text-gray-400">{l.email}</div></td>
                  <td className="px-4 py-3 text-gray-300">{l.goals || "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{l.handholdingCount}</td>
                  <td className="px-4 py-3">
                    {l.paid ? <span className="text-emerald-400">Pro</span> : <span className="text-gray-400">Free</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Help tickets */}
      <section className="mt-8">
        <h3 className="text-lg font-bold text-white">
          🙋 Human-help requests {openTickets.length > 0 && <span className="ml-2 rounded-full bg-amber-600/30 px-2 py-0.5 text-xs text-amber-300">{openTickets.length} open</span>}
        </h3>
        <div className="mt-4 space-y-3">
          {tickets.length === 0 && <p className="text-sm text-gray-500">No help requests yet.</p>}
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-panel/60 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{t.learnerName} <span className="font-normal text-gray-400">· {t.learnerEmail}</span></div>
                <span className={`text-xs ${t.status === "resolved" ? "text-emerald-400" : "text-amber-400"}`}>{t.status}</span>
              </div>
              <p className="mt-2 text-gray-200">{t.question}</p>
              {t.context && <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-gray-400">{t.context}</pre>}
              {t.status === "open" ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={ticketReply[t.id] || ""}
                    onChange={(e) => setTicketReply({ ...ticketReply, [t.id]: e.target.value })}
                    placeholder="Reply (emailed to the learner)…"
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => call("/api/tickets", { id: t.id, response: ticketReply[t.id] || "" })}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Resolve & reply
                  </button>
                </div>
              ) : (
                t.response && <p className="mt-2 text-sm text-emerald-300">↳ {t.response}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-gray-500">
        AI Mastery Portal · the room resumes itself, every single day.
      </footer>
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel/60 p-6">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 py-3">
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
    </div>
  );
}
