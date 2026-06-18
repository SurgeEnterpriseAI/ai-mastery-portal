import Link from "next/link";
import type { Metadata } from "next";
import { getPublicProfile } from "@/lib/careers";
import { getAllDayMeta } from "@/lib/curriculum";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tensorpath — Candidate profile",
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  ready: { text: "Placement-ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_process: { text: "In process", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  placed: { text: "Placed", cls: "bg-brand-50 text-brand-700 border-brand-200" },
};

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  const dayTitle = Object.fromEntries(getAllDayMeta().map((d) => [d.day, d.title]));

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="text-center">
          <div className="text-3xl">🔍</div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Profile not found</h1>
          <p className="mt-1 text-sm text-slate-500">This candidate profile link isn&rsquo;t valid.</p>
          <Link href="/careers" className="mt-4 inline-block text-brand-600 hover:underline">Explore Tensorpath careers →</Link>
        </div>
      </main>
    );
  }

  const status = STATUS_LABEL[profile.status] || STATUS_LABEL.ready;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">🎓</div>
        <div>
          <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath · Candidate profile</div>
          <div className="font-bold text-slate-900">Hiring-partner view</div>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-slate-900">{profile.name}</h1>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${status.cls}`}>{status.text}</span>
        </div>
        {profile.headline && <p className="mt-2 text-slate-600">{profile.headline}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Field label="Program" value="Tensorpath — 20-Day AI" />
          <Field label="Days completed" value={`${profile.daysCompleted} / 20`} />
          <Field label="Certificate" value={profile.certificate ? "Verified ✓" : "In progress"} />
        </div>

        {profile.completedDays.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Topics mastered</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.completedDays.map((d) => (
                <span key={d} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{dayTitle[d] || `Day ${d}`}</span>
              ))}
            </div>
          </div>
        )}

        {profile.certificate && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Capstone project</div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{profile.certificate.capstoneTitle}</h2>
            <Markdown className="prose-slide prose-compact mt-3 text-sm text-slate-700">{profile.certificate.capstoneSummary}</Markdown>
            <Link href={`/verify/${profile.certificate.credentialId}`} className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Verify credential →
            </Link>
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">
        Powered by <Link href="/" className="text-brand-600 hover:underline">Tensorpath</Link> · trained, certified, placement-ready.
      </p>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 font-semibold text-slate-900">{value}</div>
    </div>
  );
}
