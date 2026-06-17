"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

export default function Certificate({
  name, cohort, issued, days, credentialId, verifyUrl, capstoneTitle, capstoneSummary, status,
}: {
  name: string; cohort: string; issued: string; days: number;
  credentialId: string; verifyUrl: string; capstoneTitle: string; capstoneSummary: string; status: string;
}) {
  const [copied, setCopied] = useState(false);
  const revoked = status === "revoked";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/learn" className="text-sm text-gray-400 hover:text-white">← Back to dashboard</Link>
        <div className="flex gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(verifyUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg border border-white/15 px-4 py-2.5 font-semibold text-gray-200 hover:bg-white/5"
          >
            {copied ? "Link copied ✓" : "🔗 Copy verification link"}
          </button>
          <button onClick={() => window.print()} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-500">
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {revoked && (
        <div className="mb-4 rounded-lg bg-red-600/20 p-3 text-center text-sm text-red-300 print:hidden">
          This credential has been revoked and will show as invalid on its verification page.
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border-2 border-brand-500/40 bg-gradient-to-br from-ink to-panel p-12 text-center shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />

        <div className="text-5xl">🎓</div>
        <div className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-brand-300">Surge Software · AI Academy</div>
        <h1 className="mt-4 text-4xl font-extrabold text-white">Certificate of Completion</h1>
        <p className="mt-6 text-gray-300">This certifies that</p>
        <p className="mt-2 text-3xl font-extrabold text-accent">{name}</p>
        <p className="mx-auto mt-6 max-w-xl text-gray-300">
          has successfully completed all <strong className="text-white">{days} days</strong> of the
          {" "}<strong className="text-white">AI Mastery</strong> program — from the 2017 paper
          <em> &ldquo;Attention Is All You Need&rdquo;</em> to the June&nbsp;2026 frontier — and delivered the capstone project below.
        </p>

        <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-sm text-gray-400 sm:grid-cols-3">
          <div><div className="text-white">{cohort}</div><div>Cohort</div></div>
          <div><div className="text-white">{issued}</div><div>Issued</div></div>
          <div><div className="font-mono text-white">{credentialId}</div><div>Credential ID</div></div>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Verify the authenticity of this certificate at <span className="text-accent">{verifyUrl}</span>
        </p>
      </div>

      {/* Capstone one-pager */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-panel/60 p-7">
        <div className="text-xs font-bold uppercase tracking-wider text-brand-300">Capstone project</div>
        <h2 className="mt-1 text-2xl font-bold text-white">{capstoneTitle}</h2>
        <Markdown className="prose-slide mt-4 text-gray-200">{capstoneSummary}</Markdown>
      </div>
    </main>
  );
}
