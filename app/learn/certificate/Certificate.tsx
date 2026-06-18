"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

export default function Certificate({
  name, cohort, issued, days, credentialId, verifyUrl, qr, capstoneTitle, capstoneSummary, status,
}: {
  name: string; cohort: string; issued: string; days: number;
  credentialId: string; verifyUrl: string; qr?: string; capstoneTitle: string; capstoneSummary: string; status: string;
}) {
  const [copied, setCopied] = useState(false);
  const revoked = status === "revoked";
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/learn" className="text-sm text-slate-500 hover:text-slate-900">← Back to dashboard</Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(verifyUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Link copied ✓" : "🔗 Copy credential link"}
          </button>
          <a
            href={linkedInUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-lg border border-[#0a66c2] px-4 py-2.5 font-semibold text-[#0a66c2] hover:bg-[#0a66c2]/5"
          >
            in Share on LinkedIn
          </a>
          <button onClick={() => window.print()} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
            ⬇️ Download PDF
          </button>
        </div>
      </div>

      {revoked && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700 print:hidden">
          This credential has been revoked and will show as invalid on its verification page.
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200 bg-white p-12 text-center shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-50 blur-2xl" />

        <div className="text-5xl">🎓</div>
        <div className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-brand-700">Tensorpath</div>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Certificate of Completion</h1>
        <p className="mt-6 text-slate-600">This certifies that</p>
        <p className="mt-2 text-3xl font-extrabold text-accent-700">{name}</p>
        <p className="mx-auto mt-6 max-w-xl text-slate-600">
          has successfully completed all <strong className="text-slate-900">{days} days</strong> of the
          {" "}<strong className="text-slate-900">Tensorpath</strong> program — from the 2017 paper
          <em> &ldquo;Attention Is All You Need&rdquo;</em> to the June&nbsp;2026 frontier — and delivered the capstone project below.
        </p>

        <div className="mt-8 grid gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:grid-cols-3">
          <div><div className="text-slate-900">{cohort}</div><div>Cohort</div></div>
          <div><div className="text-slate-900">{issued}</div><div>Issued</div></div>
          <div><div className="font-mono text-slate-900">{credentialId}</div><div>Credential ID</div></div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2">
          {qr && <img src={qr} alt="Scan to verify this credential" className="h-28 w-28" />}
          <p className="text-xs text-slate-400">
            Scan or visit <span className="text-accent-700">{verifyUrl}</span> to verify.
          </p>
        </div>
      </div>

      {/* Capstone one-pager */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">
        <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Capstone project</div>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{capstoneTitle}</h2>
        <Markdown className="prose-slide mt-4 text-slate-700">{capstoneSummary}</Markdown>
      </div>
    </main>
  );
}
