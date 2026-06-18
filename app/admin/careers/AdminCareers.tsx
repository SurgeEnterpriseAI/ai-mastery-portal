"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobRole, Opening } from "@/lib/types";

const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500";

export default function AdminCareers({ roles, openings }: { roles: JobRole[]; openings: Opening[] }) {
  const router = useRouter();
  const roleName = Object.fromEntries(roles.map((r) => [r.id, r.title]));

  // ---- new opening form ----
  const [o, setO] = useState({ title: "", company: "", location: "", mode: "onsite", packageBand: "", applyUrl: "", roleId: "", notify: false });
  const [savingO, setSavingO] = useState(false);
  async function addOpening(e: React.FormEvent) {
    e.preventDefault();
    setSavingO(true);
    await fetch("/api/admin/openings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
    setSavingO(false);
    setO({ title: "", company: "", location: "", mode: "onsite", packageBand: "", applyUrl: "", roleId: "", notify: false });
    router.refresh();
  }
  async function toggleOpening(id: string, status: string) {
    await fetch("/api/admin/openings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: status === "open" ? "closed" : "open" }) });
    router.refresh();
  }
  async function delOpening(id: string) {
    await fetch(`/api/admin/openings?id=${id}`, { method: "DELETE" });
    router.refresh();
  }
  const [refreshing, setRefreshing] = useState("");
  async function refreshScraped() {
    setRefreshing("…");
    const res = await fetch("/api/cron/openings", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setRefreshing(res.ok ? `Pulled ${d.ingested ?? 0} live openings` : "Failed");
    setTimeout(() => setRefreshing(""), 4000);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {/* Openings */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900">Opportunities board</h2>
          <div className="flex items-center gap-2">
            {refreshing && <span className="text-sm text-slate-500">{refreshing}</span>}
            <button onClick={refreshScraped} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">🔄 Refresh live AI openings</button>
          </div>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">Auto-refreshed every 3 days from public job feeds + India listings; admin-added openings stay put. Public hub: <a href="/careers" className="text-brand-600 hover:underline">/careers</a>.</p>

        <form onSubmit={addOpening} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <input required value={o.title} onChange={(e) => setO({ ...o, title: e.target.value })} placeholder="Role title (e.g. LLM Engineer)" className={inp} />
          <input required value={o.company} onChange={(e) => setO({ ...o, company: e.target.value })} placeholder="Company (or 'Confidential')" className={inp} />
          <input value={o.location} onChange={(e) => setO({ ...o, location: e.target.value })} placeholder="Location (e.g. Hyderabad)" className={inp} />
          <select value={o.mode} onChange={(e) => setO({ ...o, mode: e.target.value })} className={inp}>
            <option value="onsite">Onsite</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option>
          </select>
          <input value={o.packageBand} onChange={(e) => setO({ ...o, packageBand: e.target.value })} placeholder="Package band (e.g. ₹8–14 LPA)" className={inp} />
          <select value={o.roleId} onChange={(e) => setO({ ...o, roleId: e.target.value })} className={inp}>
            <option value="">Map to role (optional)</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <input value={o.applyUrl} onChange={(e) => setO({ ...o, applyUrl: e.target.value })} placeholder="Apply URL (optional)" className={`${inp} sm:col-span-2`} />
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input type="checkbox" checked={o.notify} onChange={(e) => setO({ ...o, notify: e.target.checked })} className="h-4 w-4 accent-brand-600" />
            Email placement-ready candidates about this opening
          </label>
          <button disabled={savingO} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:col-span-2">
            {savingO ? "Adding…" : "Add opening"}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {openings.length === 0 && <p className="text-sm text-slate-400">No openings yet.</p>}
          {openings.map((op) => (
            <div key={op.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div>
                <span className="font-semibold text-slate-900">{op.title}</span>
                <span className="text-sm text-slate-500"> · {op.company}{op.location ? ` · ${op.location}` : ""} · {op.mode}{op.packageBand ? ` · ${op.packageBand}` : ""}</span>
                {op.roleId && roleName[op.roleId] && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{roleName[op.roleId]}</span>}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${op.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{op.status}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleOpening(op.id, op.status)} className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50">{op.status === "open" ? "Close" : "Reopen"}</button>
                <button onClick={() => delOpening(op.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles + salary bands */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">Roles & salary bands</h2>
        <p className="mt-0.5 text-sm text-slate-500">Edit the India salary band and demand note shown on each role card.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {roles.map((r) => <RoleEditor key={r.id} role={r} />)}
        </div>
      </section>
    </div>
  );
}

function RoleEditor({ role }: { role: JobRole }) {
  const router = useRouter();
  const [salaryBand, setSalary] = useState(role.salaryBand);
  const [demandNotes, setDemand] = useState(role.demandNotes);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch("/api/admin/roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: role.slug, title: role.title, salaryBand, demandNotes }),
    });
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{role.title} <span className="text-xs font-normal text-slate-400">· {role.level}</span></div>
      <label className="mt-2 block text-xs font-medium text-slate-500">Salary band</label>
      <input value={salaryBand} onChange={(e) => setSalary(e.target.value)} className={inp} />
      <label className="mt-2 block text-xs font-medium text-slate-500">Demand note</label>
      <textarea value={demandNotes} onChange={(e) => setDemand(e.target.value)} rows={2} className={inp} />
      <button onClick={save} disabled={busy} className="mt-2 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {saved ? "Saved ✓" : busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
