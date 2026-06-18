"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Cohort } from "@/lib/types";

type LearnerRow = { id: string; name: string; email: string; cohortId: string | null };
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
  const [dates, setDates] = useState("");
  const [busy, setBusy] = useState(false);

  async function createCohort(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, startDate, sessionDates: dates }) });
    setBusy(false); setName(""); setStart(""); setDates("");
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

  const unassigned = learners.filter((l) => !l.cohortId);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-slate-900">Create a cohort</h2>
        <form onSubmit={createCohort} className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cohort name (e.g. Tensorpath — Cohort 2)" className={inp} />
          <input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} className={inp} />
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

            {/* Add learner */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Add learner:</span>
              <select onChange={(e) => { if (e.target.value) assign(e.target.value, c.id); }} value="" className={inp}>
                <option value="">Select…</option>
                {unassigned.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.email})</option>)}
              </select>
            </div>

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
