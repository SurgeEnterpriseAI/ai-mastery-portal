"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "enrolled", "dropped"];
const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-brand-50 text-brand-700 border-brand-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  enrolled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dropped: "bg-slate-100 text-slate-500 border-slate-200",
};
const SOURCE_LABEL = (s: string) => (s === "surge_crosssell" ? "Surge" : s === "organic" ? "Organic" : s);

interface Stats { total: number; bySource: Record<string, number>; byStatus: Record<string, number> }

export default function AdminLeads({ leads: initial, stats }: { leads: Lead[]; stats: Stats }) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [filter, setFilter] = useState<string>("all");
  const [toast, setToast] = useState("");

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))), [leads]);
  const shown = filter === "all" ? leads : leads.filter((l) => l.source === filter);

  function patch(id: string, fields: Partial<Lead>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...fields } : l)));
  }

  async function changeStatus(id: string, status: LeadStatus) {
    patch(id, { status });
    await fetch("/api/leads/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    router.refresh();
  }

  async function convert(lead: Lead) {
    const res = await fetch("/api/leads/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      patch(lead.id, { status: "enrolled" });
      setToast(d.invite?.delivered ? `Enroll invite emailed to ${lead.email}.` : `Enroll invite created (in Outbox) for ${lead.email}.`);
      setTimeout(() => setToast(""), 4000);
      router.refresh();
    } else {
      setToast(d.error || "Could not convert lead.");
      setTimeout(() => setToast(""), 4000);
    }
  }

  const surgeCount = stats.bySource["surge_crosssell"] || 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Lead pipeline</h2>
        <Link href="/ai-track" className="text-sm text-brand-600 hover:underline">Cross-sell page ↗</Link>
      </div>

      {/* Funnel summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total leads" value={stats.total} />
        <Stat label="From Surge" value={surgeCount} />
        <Stat label="New" value={stats.byStatus["new"] || 0} />
        <Stat label="Enrolled" value={stats.byStatus["enrolled"] || 0} />
      </div>

      {toast && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{toast}</div>}

      {/* Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Source:</span>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All ({leads.length})</FilterChip>
        {sources.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {SOURCE_LABEL(s)} ({leads.filter((l) => l.source === s).length})
          </FilterChip>
        ))}
      </div>

      {/* Pipeline */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No leads yet. Share <code className="text-brand-600">/ai-track?src=surge</code> with Surge enquiries.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {shown.map((l) => (
              <div key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{l.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${l.source === "surge_crosssell" ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{SOURCE_LABEL(l.source)}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">{l.email} · {l.phone}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {l.background.replace(/_/g, " ")}{l.interest ? ` · ${l.interest.slice(0, 80)}` : ""} · {new Date(l.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={l.status}
                    onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium capitalize ${STATUS_STYLE[l.status]}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => convert(l)}
                    disabled={l.status === "enrolled"}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
                  >
                    {l.status === "enrolled" ? "Invited ✓" : "Convert → invite"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1 text-sm ${active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}
