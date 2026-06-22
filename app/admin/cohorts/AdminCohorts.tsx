"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Cohort } from "@/lib/types";

type LearnerRow = { id: string; name: string; email: string; cohortId: string | null; batchStatus: string | null };
const inp = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500";

export default function AdminCohorts({
  cohorts, learners, attendance,
}: {
  cohorts: Cohort[];
  learners: LearnerRow[];
  attendance: Record<string, Record<string, boolean>>; // cohortId -> "learnerId|date" -> present
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStart] = useState("");
  const [classTime, setClassTime] = useState("");
  const [dates, setDates] = useState("");
  const [busy, setBusy] = useState(false);

  async function createCohort(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, startDate, classTime, sessionDates: dates }) });
    setBusy(false); setName(""); setStart(""); setClassTime(""); setDates("");
    router.refresh();
  }
  async function assign(learnerId: string, cohortId: string | null) {
    await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign", learnerId, cohortId }) });
    router.refresh();
  }
  async function delCohort(id: string) {
    await fetch(`/api/admin/cohorts?id=${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function mark(cohortId: string, learnerId: string, sessionDate: string, present: boolean) {
    await fetch("/api/admin/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cohortId, learnerId, sessionDate, present }) });
    router.refresh();
  }
  const [msg, setMsg] = useState("");
  const [seatFilter, setSeatFilter] = useState<string>("all");
  async function invite(learnerId: string, name: string) {
    const res = await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", learnerId }) });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? `Batch invite ${d.delivered ? "emailed" : "queued (Outbox)"} to ${name}.` : (d.error || "Failed to invite."));
    setTimeout(() => setMsg(""), 4000);
    router.refresh();
  }
  async function assignAll(cohortId: string) {
    setBusy(true);
    const res = await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_all", cohortId }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `Assigned ${d.assigned} learner(s) to this cohort.` : (d.error || "Failed."));
    setTimeout(() => setMsg(""), 5000);
    router.refresh();
  }
  async function notifyNow(cohortId: string) {
    if (!confirm("Email all CONFIRMED learners that class is starting now, with the join link?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "notify_now", cohortId }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `🔔 Notified ${d.notified} confirmed learner(s) — ${d.delivered} emailed.` : (d.error || "Failed."));
    setTimeout(() => setMsg(""), 6000);
  }
  async function inviteAll(cohortId: string, all = false) {
    if (!confirm(all ? "Re-send the batch invite (with the latest class time) to ALL learners in this cohort?" : "Email a batch invite to everyone in this cohort who hasn't been invited yet?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite_all", cohortId, all }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `Invited ${d.invited} learner(s) — ${d.delivered} emailed.` : (d.error || "Failed."));
    setTimeout(() => setMsg(""), 6000);
    router.refresh();
  }

  const unassigned = learners.filter((l) => !l.cohortId);
  const BADGE: Record<string, string> = {
    invited: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-slate-900">Create a cohort</h2>
        <form onSubmit={createCohort} className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cohort name (e.g. Tensorpath — Cohort 2)" className={inp} />
          <input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} className={inp} />
          <input value={classTime} onChange={(e) => setClassTime(e.target.value)} placeholder="Class time (e.g. 7:00–8:30 PM IST)" className={`${inp} sm:col-span-2`} />
          <textarea value={dates} onChange={(e) => setDates(e.target.value)} rows={2} placeholder="Session dates — one YYYY-MM-DD per line (or comma-separated)" className={`${inp} sm:col-span-2`} />
          <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:col-span-2">{busy ? "Creating…" : "Create cohort"}</button>
        </form>
      </section>

      {cohorts.length === 0 && <p className="text-sm text-slate-400">No cohorts yet.</p>}

      {cohorts.map((c) => {
        const roster = learners.filter((l) => l.cohortId === c.id);
        const att = attendance[c.id] || {};
        return (
          <section key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                <div className="text-xs text-slate-500">{c.startDate ? `Starts ${c.startDate} · ` : ""}{c.sessionDates.length} sessions · {roster.length} learners</div>
              </div>
              <button onClick={() => delCohort(c.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
            </div>

            <CohortTime cohort={c} onSaved={() => router.refresh()} />

            {/* Add learner */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Add learner:</span>
              <select onChange={(e) => { if (e.target.value) assign(e.target.value, c.id); }} value="" className={inp}>
                <option value="">Select…</option>
                {unassigned.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.email})</option>)}
              </select>
              {unassigned.length > 0 && (
                <button onClick={() => assignAll(c.id)} disabled={busy} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                  + Assign all {unassigned.length} unassigned
                </button>
              )}
            </div>

            {/* Batch seats — invite + confirmation report */}
            {roster.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Batch seats</span>
                  {([
                    ["all", "All", roster.length],
                    ["confirmed", "confirmed", roster.filter((l) => l.batchStatus === "confirmed").length],
                    ["invited", "invited", roster.filter((l) => l.batchStatus === "invited").length],
                    ["declined", "declined", roster.filter((l) => l.batchStatus === "declined").length],
                  ] as const).map(([key, label, count]) => (
                    <button key={key} onClick={() => setSeatFilter(key)} className={`rounded-full border px-2 py-0.5 ${seatFilter === key ? "border-brand-300 bg-brand-50 font-semibold text-brand-700" : "border-slate-200 hover:bg-slate-50"}`}>
                      {count} {label}
                    </button>
                  ))}
                  <span className="ml-auto flex flex-wrap gap-2">
                    {roster.filter((l) => l.batchStatus === "confirmed").length > 0 && (
                      <button onClick={() => notifyNow(c.id)} disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        🔔 Notify confirmed — class starting now
                      </button>
                    )}
                    {roster.filter((l) => !l.batchStatus).length > 0 && (
                      <button onClick={() => inviteAll(c.id)} disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                        ✉ Invite all {roster.filter((l) => !l.batchStatus).length} not-yet-invited
                      </button>
                    )}
                    <button onClick={() => inviteAll(c.id, true)} disabled={busy} className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60">
                      ↻ Re-send to all {roster.length} (with time)
                    </button>
                  </span>
                </div>
                {msg && <div className="mt-1 text-xs text-emerald-700">{msg}</div>}
                {(() => {
                  const shown = roster.filter((l) => seatFilter === "all" || l.batchStatus === seatFilter);
                  return (
                    <div className="mt-1 text-xs text-slate-400">
                      Showing {shown.length} {seatFilter === "all" ? "" : seatFilter}{" "}
                      <button onClick={() => { navigator.clipboard?.writeText(shown.map((l) => l.email).join(", ")); setMsg(`Copied ${shown.length} email(s) to clipboard.`); setTimeout(() => setMsg(""), 3000); }} className="font-semibold text-brand-600 hover:underline">— copy emails</button>
                    </div>
                  );
                })()}
                <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {roster.filter((l) => seatFilter === "all" || l.batchStatus === seatFilter).map((l) => (
                    <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <div className="text-sm">
                        <span className="font-medium text-slate-800">{l.name}</span>
                        <span className="ml-2 text-xs text-slate-400">{l.email}</span>
                        <span className={`ml-2 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${BADGE[l.batchStatus || ""] || "bg-slate-100 text-slate-500 border-slate-200"}`}>{l.batchStatus || "not invited"}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => invite(l.id, l.name)} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">{l.batchStatus ? "Re-send invite" : "Send batch invite"}</button>
                        <button onClick={() => assign(l.id, null)} className="text-xs text-red-500 hover:underline">remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance grid */}
            {roster.length > 0 && c.sessionDates.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="py-2 pr-4">Learner</th>
                      {c.sessionDates.map((d) => <th key={d} className="px-2 py-2 text-center font-medium">{d.slice(5)}</th>)}
                      <th className="px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roster.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 pr-4 font-medium text-slate-800">{l.name}</td>
                        {c.sessionDates.map((d) => {
                          const present = att[`${l.id}|${d}`] ?? false;
                          return (
                            <td key={d} className="px-2 py-2 text-center">
                              <input type="checkbox" checked={present} onChange={(e) => mark(c.id, l.id, d, e.target.checked)} className="h-4 w-4 accent-brand-600" />
                            </td>
                          );
                        })}
                        <td className="px-2 text-right">
                          <button onClick={() => assign(l.id, null)} className="text-xs text-red-500 hover:underline">remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">{roster.length === 0 ? "No learners assigned yet." : "Add session dates to mark attendance."}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CohortTime({ cohort, onSaved }: { cohort: Cohort; onSaved: () => void }) {
  const [t, setT] = useState(cohort.classTime || "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  async function save() {
    setSaving(true);
    await fetch("/api/admin/cohorts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cohort.id, classTime: t }) });
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 2500); onSaved();
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">🕖 Class time:</span>
      <input value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. 7:00–8:30 PM IST" className={inp} />
      <button onClick={save} disabled={saving} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        {done ? "Saved ✓" : saving ? "Saving…" : "Save time"}
      </button>
      {!cohort.classTime && !done && <span className="text-xs text-amber-600">not set — invites won&rsquo;t show a time</span>}
    </div>
  );
}
