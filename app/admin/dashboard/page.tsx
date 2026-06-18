import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { funnelMetrics } from "@/lib/cohorts";
import AdminNav from "../AdminNav";

export const dynamic = "force-dynamic";

const SOURCE_LABEL = (s: string) => (s === "surge_crosssell" ? "Surge cross-sell" : s === "organic" ? "Organic" : s);

export default async function AdminDashboardPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const m = await funnelMetrics();

  const funnel = [
    { label: "Leads", value: m.leads.total, note: "all enquiries" },
    { label: "Enrolled", value: m.enrolled, note: "student accounts" },
    { label: "Completed 20/20", value: m.completedAll, note: `${m.completionPct}% of enrolled` },
    { label: "Certified", value: m.certified, note: "valid credentials" },
    { label: "Placed", value: m.placed, note: m.placedPct ? `${m.placedPct}% of certified` : "—" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="dashboard" />
      <h2 className="text-xl font-bold text-slate-900">Funnel — lead to placement</h2>
      <p className="mt-0.5 text-sm text-slate-500">The proof-of-ROI for the Surge cross-sell, end to end.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {funnel.map((f, i) => (
          <div key={f.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-3xl font-extrabold text-slate-900">{f.value}</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">{f.label}</div>
            <div className="text-xs text-slate-400">{f.note}</div>
            {i < funnel.length - 1 && <div className="mt-2 text-brand-300">↓</div>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Leads by source</h3>
          <div className="mt-3 space-y-2">
            {Object.keys(m.leads.bySource).length === 0 && <p className="text-sm text-slate-400">No leads yet.</p>}
            {Object.entries(m.leads.bySource).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{SOURCE_LABEL(s)}</span>
                <span className="font-semibold text-slate-900">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Leads by status</h3>
          <div className="mt-3 space-y-2">
            {["new", "contacted", "enrolled", "dropped"].map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600">{s}</span>
                <span className="font-semibold text-slate-900">{m.leads.byStatus[s] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="Open openings" value={m.openOpenings} />
        <Mini label="Placement-ready" value={m.placementReady} />
        <Mini label="Completion rate" value={`${m.completionPct}%`} />
        <Mini label="Placed (of certified)" value={`${m.placedPct}%`} />
      </div>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
