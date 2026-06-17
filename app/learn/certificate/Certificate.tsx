"use client";

import Link from "next/link";

export default function Certificate({ name, cohort, issued, days }: { name: string; cohort: string; issued: string; days: number }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link href="/learn" className="text-sm text-gray-400 hover:text-white">← Back to dashboard</Link>
        <button onClick={() => window.print()} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-500">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-2 border-brand-500/40 bg-gradient-to-br from-ink to-panel p-12 text-center shadow-2xl print:border-brand-500">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />

        <div className="text-5xl">🎓</div>
        <div className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-brand-300">Surge Software · AI Academy</div>
        <h1 className="mt-4 text-4xl font-extrabold text-white">Certificate of Completion</h1>
        <p className="mt-6 text-gray-300">This certifies that</p>
        <p className="mt-2 text-3xl font-extrabold text-accent">{name}</p>
        <p className="mx-auto mt-6 max-w-xl text-gray-300">
          has successfully completed all <strong className="text-white">{days} days</strong> of the
          {" "}<strong className="text-white">AI Mastery</strong> program — a story-driven journey from the 2017 paper
          <em> &ldquo;Attention Is All You Need&rdquo;</em> to the June&nbsp;2026 frontier of reasoning models,
          multimodal AI, and agents.
        </p>

        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-sm text-gray-400">
          <div className="text-left">
            <div className="text-white">{cohort}</div>
            <div>Cohort</div>
          </div>
          <div className="text-right">
            <div className="text-white">{issued}</div>
            <div>Issued</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500 print:hidden">
        Tip: use your browser&rsquo;s &ldquo;Save as PDF&rdquo; in the print dialog.
      </p>
    </main>
  );
}
