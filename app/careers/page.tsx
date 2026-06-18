import Link from "next/link";
import { listJobRoles, listOpenings, placementStats } from "@/lib/careers";
import { ensureDemoContent } from "@/lib/seed-demo";
import { getAllDayMeta } from "@/lib/curriculum";
import OpeningsBoard from "./OpeningsBoard";

export const dynamic = "force-dynamic";

const LEVEL_STYLE: Record<string, string> = {
  entry: "bg-emerald-50 text-emerald-700",
  mid: "bg-amber-50 text-amber-700",
  senior: "bg-brand-50 text-brand-700",
};

export default async function CareersPage() {
  await ensureDemoContent();
  const [roles, openings, stats, dayMetas] = await Promise.all([
    listJobRoles(), listOpenings({ openOnly: true }), placementStats(), Promise.resolve(getAllDayMeta()),
  ]);
  const dayTitle = Object.fromEntries(dayMetas.map((d) => [d.day, d.title]));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">💼</div>
          <div>
            <div className="text-sm uppercase tracking-widest text-brand-600">Careers & Placement</div>
            <div className="text-lg font-bold text-slate-900">Tensorpath</div>
          </div>
        </Link>
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
      </header>

      <section className="mt-10">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-slate-900">
          Train for a real AI job — and the salary that comes with it.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Every one of the 20 days maps to skills employers are hiring for right now. Here are the roles Tensorpath
          targets, what they pay in India, live openings, and how we get you placement-ready.
        </p>
        {(stats.placed > 0 || stats.certified > 0) && (
          <div className="mt-6 flex flex-wrap gap-4">
            {stats.placed > 0 && <Stat label="Placed" value={`${stats.placed}`} />}
            {stats.placedPct > 0 && <Stat label="Of certified, placed" value={`${stats.placedPct}%`} />}
            {stats.placementReady > 0 && <Stat label="Placement-ready" value={`${stats.placementReady}`} />}
            {stats.certified > 0 && <Stat label="Certified" value={`${stats.certified}`} />}
          </div>
        )}
      </section>

      {/* Job roles catalogue + salary (REQ-E1, E3) */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900">Roles this program targets</h2>
        <p className="mt-1 text-slate-500">Each role shows the India salary band and exactly which days build it.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {roles.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{r.title}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_STYLE[r.level] || "bg-slate-100 text-slate-600"}`}>{r.level}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{r.description}</p>

              {/* salary band — prominent (REQ-E3) */}
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3">
                <div>
                  <div className="text-xl font-extrabold text-brand-700">{r.salaryBand}</div>
                  <div className="text-[11px] uppercase tracking-wider text-brand-600">India salary band</div>
                </div>
                <p className="flex-1 text-xs text-slate-600">{r.demandNotes}</p>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Skills you&rsquo;ll earn</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.skills.map((s) => <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{s}</span>)}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Built in</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.curriculumDays.map((d) => (
                    <span key={d} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">Day {d}{dayTitle[d] ? ` · ${dayTitle[d]}` : ""}</span>
                  ))}
                </div>
              </div>

              {r.capstoneFit && <p className="mt-3 text-xs text-slate-500"><span className="font-semibold text-slate-600">Capstone fit:</span> {r.capstoneFit}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Openings board (REQ-E2) */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900">Live opportunities</h2>
        <p className="mt-1 text-slate-500">Current openings we&rsquo;re tracking. Filter by role or location.</p>
        <div className="mt-6">
          <OpeningsBoard openings={openings} roles={roles} />
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Get certified, get placement-ready.</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">Finish the 20 days + a capstone to earn a verifiable certificate and a shareable placement profile we put in front of hiring partners.</p>
        <Link href="/join" className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
