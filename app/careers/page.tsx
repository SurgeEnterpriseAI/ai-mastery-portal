import Link from "next/link";
import { listJobRoles } from "@/lib/careers";
import { ensureDemoContent } from "@/lib/seed-demo";
import { getAllDayMeta } from "@/lib/curriculum";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Career help — visit the Surge office in Bengaluru",
  description:
    "Finished Tensorpath? Get hands-on career help in person at the Surge office in Bengaluru — résumé & personal marketing, mock interviews & interview prep, and placement support. Free for learners.",
  alternates: { canonical: "/careers" },
  openGraph: { title: "Career help at the Surge Bengaluru office — Tensorpath", description: "In-person résumé, interview prep and placement help after you finish the program.", url: "https://tensorpath.in/careers" },
};

const LEVEL_STYLE: Record<string, string> = {
  entry: "bg-emerald-50 text-emerald-700",
  mid: "bg-amber-50 text-amber-700",
  senior: "bg-brand-50 text-brand-700",
};

export default async function CareersPage() {
  await ensureDemoContent();
  const [roles, dayMetas] = await Promise.all([listJobRoles(), Promise.resolve(getAllDayMeta())]);
  const dayTitle = Object.fromEntries(dayMetas.map((d) => [d.day, d.title]));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">💼</div>
          <div>
            <div className="text-sm uppercase tracking-widest text-brand-600">Career help</div>
            <div className="text-lg font-bold text-slate-900">Tensorpath</div>
          </div>
        </Link>
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
      </header>

      <section className="mt-10">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-slate-900">
          Trained? Now get hired — with hands-on help at our <span className="text-brand-600">Bengaluru office</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          The training is free and online. When you finish, come and meet us in person at the <strong>Surge office in Bengaluru</strong> for
          real, one-on-one career support — and we&rsquo;ll help you turn your new AI skills into a job.
        </p>
      </section>

      {/* What we help with */}
      <section className="mt-12">
        <div className="grid gap-5 md:grid-cols-3">
          <HelpCard icon="📝" title="Résumé & personal marketing" body="Build a standout, AI-focused résumé and LinkedIn/portfolio that gets you noticed — positioned around the projects you built." />
          <HelpCard icon="🎤" title="Mock interviews & prep" body="Practice real AI interview questions, walk through your capstone, and get honest feedback until you're confident." />
          <HelpCard icon="🤝" title="Placement support" body="We connect you to opportunities, make referrals where we can, and prep you specifically for the roles you're targeting." />
        </div>
      </section>

      {/* Visit us */}
      <section className="mt-12">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:grid-cols-2">
          <div className="p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">📍 Visit us</div>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">The Surge office — Bengaluru</h2>
            <p className="mt-2 text-slate-600">Career help is in person and free for Tensorpath learners. Walk in during visiting hours, or book ahead so we set aside time for you.</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex gap-3"><dt className="w-20 shrink-0 font-semibold text-slate-500">Address</dt><dd className="text-slate-800">Surge Software Solutions Pvt. Ltd., Bengaluru · <a href="https://www.google.com/maps/place/Surge+Software+Solutions+Private+Limited/@12.9606894,77.7214194,734m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bae139df9cf6713:0xbb76b6833b5cdf62!8m2!3d12.9606894!4d77.7214194" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">Get directions →</a></dd></div>
              <div className="flex gap-3"><dt className="w-20 shrink-0 font-semibold text-slate-500">Hours</dt><dd className="text-slate-800">10:00 AM – 7:00 PM</dd></div>
              <div className="flex gap-3"><dt className="w-20 shrink-0 font-semibold text-slate-500">Phone</dt><dd className="text-slate-800"><a href="tel:+917624967999" className="font-semibold text-brand-600 hover:underline">+91 76249 67999</a> · <a href="https://wa.me/917624967999" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 hover:underline">WhatsApp</a></dd></div>
              <div className="flex gap-3"><dt className="w-20 shrink-0 font-semibold text-slate-500">Email</dt><dd><a href="mailto:corp@surgesoftware.co.in" className="font-semibold text-brand-600 hover:underline">corp@surgesoftware.co.in</a></dd></div>
            </dl>
            <Link href="/enquiry" className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">📅 Book your office visit</Link>
            <p className="mt-4 text-xs text-slate-400"><span className="font-semibold text-slate-500">Bring:</span> your Tensorpath certificate, your capstone, and a current résumé.</p>
          </div>
          <div className="min-h-[320px] bg-slate-100">
            <iframe
              title="Surge Software Solutions — Bengaluru"
              src="https://maps.google.com/maps?q=12.9606894,77.7214194&z=16&output=embed"
              className="h-full min-h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Roles we prepare you for + salary bands */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900">The AI roles we prepare you for</h2>
        <p className="mt-1 text-slate-500">What each role pays in India, the skills you&rsquo;ll earn, and the days that build them.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {roles.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{r.title}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_STYLE[r.level] || "bg-slate-100 text-slate-600"}`}>{r.level}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{r.description}</p>
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

      <section className="mt-14 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Finish the program, then come see us.</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">The 20 days + your capstone are free and online. The career help is hands-on and in person at our Bengaluru office.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/join" className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
          <Link href="/enquiry" className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">Book an office visit</Link>
        </div>
      </section>
    </main>
  );
}

function HelpCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
