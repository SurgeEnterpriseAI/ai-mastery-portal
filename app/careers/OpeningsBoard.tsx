"use client";

import { useMemo, useState } from "react";
import type { Opening, JobRole } from "@/lib/types";

const MODE_STYLE: Record<string, string> = {
  remote: "bg-emerald-50 text-emerald-700",
  hybrid: "bg-amber-50 text-amber-700",
  onsite: "bg-slate-100 text-slate-600",
};

export default function OpeningsBoard({ openings, roles }: { openings: Opening[]; roles: JobRole[] }) {
  const [role, setRole] = useState("all");
  const [loc, setLoc] = useState("all");

  const roleName = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r.title])), [roles]);
  const locations = useMemo(() => Array.from(new Set(openings.map((o) => o.location).filter(Boolean))), [openings]);

  const shown = openings.filter((o) => (role === "all" || o.roleId === role) && (loc === "all" || o.location === loc));

  const sel = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={role} onChange={(e) => setRole(e.target.value)} className={sel}>
          <option value="all">All roles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <select value={loc} onChange={(e) => setLoc(e.target.value)} className={sel}>
          <option value="all">All locations</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-sm text-slate-400">{shown.length} opening{shown.length === 1 ? "" : "s"}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {shown.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 sm:col-span-2">No openings match right now — check back soon, new roles are added regularly.</p>
        ) : shown.map((o) => (
          <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900">{o.title}</h4>
                <div className="text-sm text-slate-500">{o.company}{o.location ? ` · ${o.location}` : ""}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${MODE_STYLE[o.mode] || "bg-slate-100 text-slate-600"}`}>{o.mode}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {o.packageBand && <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">{o.packageBand}</span>}
              {o.roleId && roleName[o.roleId] && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{roleName[o.roleId]}</span>}
            </div>
            {o.applyUrl && (
              <a href={o.applyUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
                Apply / details →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
