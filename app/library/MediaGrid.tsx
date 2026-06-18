"use client";

import { useMemo, useState } from "react";
import type { MediaItem, JobRole } from "@/lib/types";

function embed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed/")) return url;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch { return null; }
}

export default function MediaGrid({ items, roles, showRoleFilter }: { items: MediaItem[]; roles: JobRole[]; showRoleFilter?: boolean }) {
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");
  const roleName = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r.title])), [roles]);

  const shown = items.filter((m) => {
    if (showRoleFilter && role !== "all" && m.roleId !== role) return false;
    if (q) {
      const hay = `${m.title} ${m.description} ${m.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const sel = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500";
  return (
    <div>
      {(showRoleFilter || items.length > 3) && (
        <div className="flex flex-wrap items-center gap-2">
          {showRoleFilter && (
            <select value={role} onChange={(e) => setRole(e.target.value)} className={sel}>
              <option value="all">All roles</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          )}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={sel} />
          <span className="text-sm text-slate-400">{shown.length} video{shown.length === 1 ? "" : "s"}</span>
        </div>
      )}

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {shown.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 sm:col-span-2">Nothing here yet — new recordings are added regularly.</p>
        ) : shown.map((m) => {
          const e = embed(m.url);
          return (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="aspect-video bg-slate-900">
                {e ? (
                  <iframe src={e} title={m.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="grid h-full w-full place-items-center text-sm font-semibold text-white hover:underline">▶ Open recording</a>
                )}
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-900">{m.title}</h4>
                {m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.roleId && roleName[m.roleId] && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">{roleName[m.roleId]}</span>}
                  {m.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{t}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
