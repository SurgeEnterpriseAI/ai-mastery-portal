"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MediaItem, JobRole } from "@/lib/types";

const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500";

export default function AdminMedia({ media, roles }: { media: MediaItem[]; roles: JobRole[] }) {
  const router = useRouter();
  const roleName = Object.fromEntries(roles.map((r) => [r.id, r.title]));
  const [m, setM] = useState({ type: "interview", title: "", description: "", roleId: "", url: "", gatedLevel: "enrolled", tags: "" });
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) });
    setBusy(false);
    setM({ type: "interview", title: "", description: "", roleId: "", url: "", gatedLevel: "enrolled", tags: "" });
    router.refresh();
  }
  async function del(id: string) {
    await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-slate-900">Add a recording</h2>
        <p className="mt-0.5 text-sm text-slate-500">YouTube/Vimeo links auto-embed on the <a href="/library" className="text-brand-600 hover:underline">/library</a> page. Anything else shows as a link.</p>
        <form onSubmit={add} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <select value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })} className={inp}>
            <option value="interview">Interview</option><option value="orientation">Orientation</option>
          </select>
          <select value={m.gatedLevel} onChange={(e) => setM({ ...m, gatedLevel: e.target.value })} className={inp}>
            <option value="enrolled">Enrolled students</option><option value="certified">Certified only</option><option value="public">Public</option>
          </select>
          <input required value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} placeholder="Title" className={`${inp} sm:col-span-2`} />
          <input required value={m.url} onChange={(e) => setM({ ...m, url: e.target.value })} placeholder="Video URL (YouTube/Vimeo/embed)" className={`${inp} sm:col-span-2`} />
          <select value={m.roleId} onChange={(e) => setM({ ...m, roleId: e.target.value })} className={inp}>
            <option value="">Map to role (optional)</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <input value={m.tags} onChange={(e) => setM({ ...m, tags: e.target.value })} placeholder="Tags (comma-separated)" className={inp} />
          <textarea value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} rows={2} placeholder="Description" className={`${inp} sm:col-span-2`} />
          <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:col-span-2">{busy ? "Adding…" : "Add recording"}</button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">Library ({media.length})</h2>
        <div className="mt-4 space-y-2">
          {media.length === 0 && <p className="text-sm text-slate-400">No recordings yet.</p>}
          {media.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div className="text-sm">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">{x.type}</span>
                <span className="ml-2 font-semibold text-slate-900">{x.title}</span>
                {x.roleId && roleName[x.roleId] && <span className="ml-2 text-xs text-slate-500">· {roleName[x.roleId]}</span>}
                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{x.gatedLevel}</span>
              </div>
              <button onClick={() => del(x.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
