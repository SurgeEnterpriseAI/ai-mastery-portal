import Link from "next/link";
import type { Metadata } from "next";
import { allDays, TOTAL_DAYS } from "@/lib/curriculum";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Syllabus — the 20 days of the Tensorpath AI course",
  description:
    "The Tensorpath syllabus day by day: from the 2017 Transformer paper to reasoning models and AI agents, with each day's topic, length and what you will learn.",
  alternates: { canonical: "/syllabus" },
  openGraph: { title: "Tensorpath syllabus: 20 days of AI", description: "Each day's topic and learning objectives, from attention to AI agents.", url: "https://tensorpath.in/syllabus" },
};

/** The 20 course days as plain text, from content/curriculum (the same files the live class and /llms.txt use). */
export default function SyllabusPage() {
  const days = [...allDays()].sort((a, b) => a.day - b.day);
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to Tensorpath</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Syllabus: {TOTAL_DAYS} days of AI</h1>
      <p className="mt-2 text-slate-600">
        One topic a day, taught live by a trainer, from the 2017 paper &ldquo;Attention Is All You Need&rdquo; to today&rsquo;s
        reasoning models and AI agents. Questions about price, format or the certificate are answered in the{" "}
        <Link href="/faq" className="text-brand-600 hover:underline">FAQ</Link>.
      </p>
      <ol className="mt-8 space-y-8">
        {days.map((d) => (
          <li key={d.day} id={`day-${d.day}`}>
            <h2 className="text-xl font-bold text-slate-900">
              Day {d.day}: {d.title}
            </h2>
            {d.subtitle && <p className="mt-1 text-slate-600">{d.subtitle}</p>}
            {d.duration && <p className="mt-1 text-sm text-slate-500">Length: {d.duration}</p>}
            {d.learningObjectives?.length > 0 && (
              <>
                <h3 className="mt-3 text-sm font-semibold uppercase tracking-wider text-slate-500">You will learn to</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                  {d.learningObjectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
        <Link href="/faq" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">FAQ</Link>
      </div>
    </main>
  );
}
