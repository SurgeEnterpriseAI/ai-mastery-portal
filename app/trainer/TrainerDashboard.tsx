"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Trainee, Session, Progress, OutboxMail, DayMeta } from "@/lib/types";
import Tour from "@/components/Tour";

const TRAINER_STEPS = [
  { title: "Tensorpath trainer console 👋", body: "This is where you run Tensorpath's AI training at scale — schedule cohorts, present the 20-day program live, and track every learner. Quick tour of the flow." },
  { target: '[data-tour="td-start"]', title: "Teach the live class", body: "Start or resume the class — it reopens at the exact slide you left off, and advances the cohort automatically as you finish each day." },
  { target: '[data-tour="td-schedule"]', title: "Schedule & invite", body: "Pick a day, date and time, then email invites to your learners in one click." },
  { target: '[data-tour="td-trainees"]', title: "Add your learners", body: "Add learners here — paste many emails at once (comma or newline separated)." },
  { target: '[data-tour="td-curriculum"]', title: "20 ready-to-teach days", body: "Open any day to present it. Learners can also self-enrol, use the AI coach, and earn verifiable certificates you manage below. That's it!" },
];

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
interface CertRow {
  credentialId: string; learnerName: string; capstoneTitle: string; status: string; issuedAt: string;
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
  certificates: CertRow[];
}

export default function TrainerDashboard({ initial }: { initial: InitialData }) {
  const router = useRouter();
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    cohortName, trainees, sessions, progress, outbox, dayMetas,
    daysReady, totalDays, smtpConfigured, learners, tickets, payments, certificates,
  } = initial;

  const openTickets = tickets.filter((t) => t.status === "open");
  const paidCount = learners.filter((l) => l.paid).length;
  const revenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const [ticketReply, setTicketReply] = useState<Record<string, string>>({});
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");

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
      <Tour steps={TRAINER_STEPS} storageKey="trainer" />
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
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🧠</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath · Trainer Console</div>
            <div className="text-lg font-bold text-slate-900">{cohortName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
            ⚙️ Leads & Admin
          </Link>
          <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Public view
          </Link>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Log out
          </button>
        </div>
      </header>

      {/* Resume hero */}
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-brand-200 bg-brand-50 border border-brand-100 p-6">
          <div className="text-xs uppercase tracking-widest text-brand-700">Resume teaching</div>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
            Day {progress.currentDay}: {currentDayMeta?.title || "—"}
          </h2>
          <p className="mt-1 text-slate-600">{currentDayMeta?.subtitle}</p>
          <p className="mt-3 text-sm text-slate-500">
            The portal saved your place at <strong className="text-slate-900">slide {progress.currentSlide + 1}</strong>
            {progress.lastTaughtAt
              ? ` · last taught ${new Date(progress.lastTaughtAt).toLocaleString()}`
              : " · not started yet"}
            . Opening the room resumes exactly here.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/present/${progress.currentDay}`}
              data-tour="td-start"
              className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              ▶ Start / Resume class
            </Link>
            <button
              onClick={() => call("/api/announce", { day: progress.currentDay })}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              📣 Announce &ldquo;what&rsquo;s coming&rdquo; to class
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-xs uppercase tracking-widest text-slate-500">Cohort progress</div>
          <div className="mt-2 text-4xl font-extrabold text-slate-900">{pct}%</div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 text-sm text-slate-500">
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
            <label className="col-span-2 text-xs uppercase tracking-wider text-slate-500">Day</label>
            <select
              value={schedDay}
              onChange={(e) => setSchedDay(Number(e.target.value))}
              className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
            >
              {dayMetas.map((d) => (
                <option key={d.day} value={d.day}>
                  Day {d.day} — {d.title}
                </option>
              ))}
            </select>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Date</label>
              <input
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Time</label>
              <input
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
              />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!schedDate) return flash("Pick a date first", false);
              await call("/api/sessions", { day: schedDay, date: schedDate, time: schedTime });
            }}
            disabled={busy}
            data-tour="td-schedule"
            className="mt-3 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            + Schedule session
          </button>

          <div className="mt-4 space-y-2">
            {sessions.length === 0 && <p className="text-sm text-slate-400">No sessions scheduled yet.</p>}
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Day {s.day}: {s.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.date} @ {s.time} ·{" "}
                    <span className={s.status === "completed" ? "text-emerald-700" : "text-amber-700"}>{s.status}</span>
                    {s.invitesSent && <span className="text-brand-700"> · invited</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => call("/api/sessions/invite", { id: s.id })}
                    disabled={busy}
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {s.invitesSent ? "Re-send invites" : "Send invites"}
                  </button>
                  <button
                    onClick={() => call(`/api/sessions?id=${s.id}`, undefined, "DELETE")}
                    disabled={busy}
                    className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
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
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
            />
            <input
              placeholder="email@domain.com"
              value={traineeEmail}
              onChange={(e) => setTraineeEmail(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
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
            data-tour="td-trainees"
            className="mt-3 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            + Add trainee(s)
          </button>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {trainees.length === 0 && <p className="text-sm text-slate-400">No trainees yet.</p>}
            {trainees.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.email}</div>
                </div>
                <button
                  onClick={() => call(`/api/trainees?id=${t.id}`, undefined, "DELETE")}
                  disabled={busy}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Curriculum browser */}
      <section className="mt-8" data-tour="td-curriculum">
        <h3 className="text-lg font-bold text-slate-900">📚 Curriculum — 20 days</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dayMetas.map((d) => {
            const done = progress.completedDays.includes(d.day);
            const current = d.day === progress.currentDay;
            return (
              <Link
                key={d.day}
                href={`/present/${d.day}`}
                className={`rounded-xl border p-4 transition hover:border-brand-300 ${
                  current ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Day {d.day}</span>
                  {done ? (
                    <span className="text-xs text-emerald-700">✓ done</span>
                  ) : current ? (
                    <span className="text-xs text-amber-700">▶ next</span>
                  ) : d.slideCount === 0 ? (
                    <span className="text-xs text-slate-400">loading…</span>
                  ) : (
                    <span className="text-xs text-slate-400">{d.slideCount} slides</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-slate-900">{d.title}</div>
                <div className="mt-0.5 text-xs text-slate-500 line-clamp-2">{d.subtitle}</div>
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
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
            />
            <button
              onClick={() => call("/api/cohort", { cohortName: nameEdit })}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
          <div className={`mt-4 rounded-lg p-3 text-sm ${smtpConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
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
            className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Send a test email
          </button>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Change password</div>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              placeholder="Current password"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
            />
            <input
              type="password"
              value={pwNext}
              onChange={(e) => setPwNext(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
            />
            <button
              onClick={async () => {
                if (pwNext.length < 8) return flash("New password must be at least 8 characters", false);
                const d = await call("/api/trainer/password", { current: pwCurrent, next: pwNext });
                if (d) { setPwCurrent(""); setPwNext(""); }
              }}
              disabled={busy}
              className="mt-2 w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Update password
            </button>
          </div>
        </Panel>

        <Panel title="📨 Outbox" subtitle="Every invite, announcement & test — most recent first.">
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {outbox.length === 0 && <p className="text-sm text-slate-400">Nothing sent yet.</p>}
            {outbox.map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{m.subject}</span>
                  <span className={`text-xs ${m.delivered ? "text-emerald-700" : "text-amber-700"}`}>
                    {m.delivered ? "delivered" : "outbox"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
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
          <h3 className="text-lg font-bold text-slate-900">🎓 Learners (self-service AI coaching)</h3>
          <div className="flex gap-3 text-sm">
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-600">{learners.length} learners</span>
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-emerald-700">{paidCount} Pro</span>
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-accent-700">₹{(revenue / 100).toLocaleString()} revenue</span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">Coaching used</th>
                <th className="px-4 py-3">Plan</th>
              </tr>
            </thead>
            <tbody>
              {learners.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-slate-400">No learners yet. Share the <code>/join</code> link.</td></tr>
              )}
              {learners.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="px-4 py-3"><div className="font-medium text-slate-900">{l.name}</div><div className="text-xs text-slate-500">{l.email}</div></td>
                  <td className="px-4 py-3 text-slate-600">{l.goals || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{l.handholdingCount}</td>
                  <td className="px-4 py-3">
                    {l.paid ? <span className="text-emerald-700">Pro</span> : <span className="text-slate-500">Free</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Help tickets */}
      <section className="mt-8">
        <h3 className="text-lg font-bold text-slate-900">
          🙋 Human-help requests {openTickets.length > 0 && <span className="ml-2 rounded-full bg-amber-600/30 px-2 py-0.5 text-xs text-amber-700">{openTickets.length} open</span>}
        </h3>
        <div className="mt-4 space-y-3">
          {tickets.length === 0 && <p className="text-sm text-slate-400">No help requests yet.</p>}
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{t.learnerName} <span className="font-normal text-slate-500">· {t.learnerEmail}</span></div>
                <span className={`text-xs ${t.status === "resolved" ? "text-emerald-700" : "text-amber-700"}`}>{t.status}</span>
              </div>
              <p className="mt-2 text-slate-700">{t.question}</p>
              {t.context && <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{t.context}</pre>}
              {t.status === "open" ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={ticketReply[t.id] || ""}
                    onChange={(e) => setTicketReply({ ...ticketReply, [t.id]: e.target.value })}
                    placeholder="Reply (emailed to the learner)…"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => call("/api/tickets", { id: t.id, response: ticketReply[t.id] || "" })}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Resolve & reply
                  </button>
                </div>
              ) : (
                t.response && <p className="mt-2 text-sm text-emerald-700">↳ {t.response}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Certificates */}
      <section className="mt-8">
        <h3 className="text-lg font-bold text-slate-900">🎓 Issued certificates ({certificates.length})</h3>
        <p className="mt-0.5 text-sm text-slate-500">Every credential is publicly verifiable at <code>/verify/&lt;id&gt;</code>. Revoke to invalidate.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3">Credential</th>
                <th className="px-4 py-3">Holder</th>
                <th className="px-4 py-3">Capstone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {certificates.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-slate-400">No certificates issued yet.</td></tr>
              )}
              {certificates.map((c) => (
                <tr key={c.credentialId} className="border-b border-slate-100">
                  <td className="px-4 py-3"><a href={`/verify/${c.credentialId}`} target="_blank" className="font-mono text-xs text-accent-700 hover:underline">{c.credentialId}</a></td>
                  <td className="px-4 py-3 text-slate-900">{c.learnerName}</td>
                  <td className="px-4 py-3 text-slate-600">{c.capstoneTitle}</td>
                  <td className="px-4 py-3">
                    {c.status === "revoked" ? <span className="text-red-600">revoked</span> : <span className="text-emerald-700">valid</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => call("/api/certificate/revoke", { credentialId: c.credentialId, revoke: c.status !== "revoked" })}
                      disabled={busy}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {c.status === "revoked" ? "Reinstate" : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
        Tensorpath · the room resumes itself, every single day.
      </footer>
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-3">
      <div className="text-xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
