"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Placement, PlacementStatus } from "@/lib/types";

interface Row {
  learnerId: string; name: string; email: string; daysCompleted: number;
  certified: boolean; profileStatus: PlacementStatus | null; slug: string | null; headline: string | null;
}
interface Stats { placed: number; placementReady: number; certified: number; placedPct: number }

const STATUSES: PlacementStatus[] = ["ready", "in_process", "placed"];
const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500";

export default function AdminPlacements({ learners, placements, stats }: { learners: Row[]; placements: Placement[]; stats: Stats }) {
  const router = useRouter();
  const [recordFor, setRecordFor] = useState<Row | null>(null);

  async function setStatus(r: Row, status: PlacementStatus) {
    await fetch("/api/admin/placements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ learnerId: r.learnerId, name: r.name, status }) });
    router.refresh();
  }
  async function delPlacement(id: string) {
    await fetch(`/api/admin/placements?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Placed" value={stats.placed} />
        <Stat label="Placement-ready" value={stats.placementReady} />
        <Stat label="Certified" value={stats.certified} />
        <Stat label="% certified placed" value={stats.placedPct} suffix="%" />
      </div>

      {/* Learners → placement status */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">Candidates</h2>
        <p className="mt-0.5 text-sm text-slate-500">Mark placement status and record placements. A status creates a shareable profile.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {learners.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No learners yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {learners.map((r) => (
                <div key={r.learnerId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <span className="font-semibold text-slate-900">{r.name}</span>
                    <span className="text-sm text-slate-500"> · {r.daysCompleted}/20 days</span>
                    {r.certified && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">certified</span>}
                    {r.slug && <a href={`/profile/${r.slug}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-brand-600 hover:underline">view profile ↗</a>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={r.profileStatus || ""}
                      onChange={(e) => setStatus(r, e.target.value as PlacementStatus)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700"
                    >
                      <option value="" disabled>Set status…</option>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    <button onClick={() => setRecordFor(r)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">Record placement</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recorded placements */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">Placements</h2>
        <div className="mt-4 space-y-2">
          {placements.length === 0 && <p className="text-sm text-slate-400">No placements recorded yet.</p>}
          {placements.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div className="text-sm">
                <span className="font-semibold text-slate-900">{p.learnerName}</span>
                <span className="text-slate-500"> → {p.role} @ {p.company}{p.packageBand ? ` · ${p.packageBand}` : ""} · {p.date}</span>
              </div>
              <button onClick={() => delPlacement(p.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
            </div>
          ))}
        </div>
      </section>

      {recordFor && <RecordModal row={recordFor} onClose={() => setRecordFor(null)} onDone={() => { setRecordFor(null); router.refresh(); }} />}
    </div>
  );
}

function RecordModal({ row, onClose, onDone }: { row: { learnerId: string; name: string }; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [packageBand, setPackage] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/placements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: row.learnerId, learnerName: row.name, role, company, packageBand, date }),
    });
    setBusy(false);
    onDone();
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-cardhover">
        <h3 className="text-lg font-bold text-slate-900">Record placement — {row.name}</h3>
        <input required value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. LLM Engineer)" className={inp} />
        <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className={inp} />
        <input value={packageBand} onChange={(e) => setPackage(e.target.value)} placeholder="Package (e.g. ₹12 LPA)" className={inp} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : "Record"}</button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
      <div className="text-2xl font-extrabold text-slate-900">{value}{suffix}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
