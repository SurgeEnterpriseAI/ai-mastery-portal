import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentLearner } from "@/lib/learner";
import { getCertificateForLearner } from "@/lib/data";
import { listMedia } from "@/lib/media";
import { listJobRoles } from "@/lib/careers";
import MediaGrid from "./MediaGrid";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/signin");

  const cert = await getCertificateForLearner(learner.id);
  const certified = Boolean(cert && cert.status === "valid");

  const [allMedia, roles] = await Promise.all([listMedia(), listJobRoles()]);
  // access control: certified-only items hidden unless the learner is certified
  const visible = allMedia.filter((m) => m.gatedLevel !== "certified" || certified);
  const interviews = visible.filter((m) => m.type === "interview");
  const orientation = visible.filter((m) => m.type === "orientation");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/learn" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🎬</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath · Library</div>
            <div className="text-lg font-bold text-slate-900">Interview prep & orientation</div>
          </div>
        </Link>
        <Link href="/learn" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">← Dashboard</Link>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">🎤 Recorded interviews</h2>
        <p className="mt-0.5 text-sm text-slate-500">Mock & real interview sessions. Filter by the role you&rsquo;re targeting.</p>
        <div className="mt-4"><MediaGrid items={interviews} roles={roles} showRoleFilter /></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">🧭 Orientation</h2>
        <p className="mt-0.5 text-sm text-slate-500">How to apply, how to present your capstone, what to expect after training.</p>
        <div className="mt-4"><MediaGrid items={orientation} roles={roles} /></div>
      </section>

      {!certified && (
        <p className="mt-10 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-slate-600">
          🔒 Some advanced recordings unlock once you&rsquo;re <Link href="/learn/certificate" className="text-brand-600 hover:underline">certified</Link>.
        </p>
      )}
    </main>
  );
}
