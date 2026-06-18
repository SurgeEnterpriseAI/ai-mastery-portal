import Link from "next/link";
import type { Metadata } from "next";
import { getCertificateByCredentialId } from "@/lib/data";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify credential — Tensorpath",
  robots: { index: false },
};

export default async function VerifyPage({ params }: { params: { credentialId: string } }) {
  const cert = await getCertificateByCredentialId(params.credentialId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">🧠</div>
        <div>
          <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath</div>
          <div className="font-bold text-slate-900">Credential verification</div>
        </div>
      </header>

      {!cert ? (
        <Result tone="gray" icon="❓" title="No credential found"
          subtitle={`We couldn't find a certificate with ID ${params.credentialId}. Check the ID and try again.`} />
      ) : cert.status === "revoked" ? (
        <Result tone="red" icon="⛔" title="Credential revoked"
          subtitle={`This credential (${cert.credentialId}) was issued to ${cert.learnerName} but has since been revoked by the issuer and is no longer valid.`} />
      ) : (
        <>
          <Result tone="green" icon="✓" title="Verified — genuine credential"
            subtitle={`Issued by Tensorpath. This certificate is authentic and was issued to the holder named below.`} />

          <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
            <Field label="Issued to" value={cert.learnerName} />
            <Field label="Program" value="Tensorpath — 20-Day Program" />
            <Field label="Cohort" value={cert.cohort} />
            <Field label="Days completed" value={`${cert.daysCompleted} / 20`} />
            <Field label="Issued on" value={new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
            <Field label="Credential ID" value={cert.credentialId} mono />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Capstone project</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{cert.capstoneTitle}</h2>
            <Markdown className="prose-slide mt-4 text-slate-700">{cert.capstoneSummary}</Markdown>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        <Link href="/verify" className="text-accent-700 hover:underline">Verify another credential</Link>
        {" · "}This page reflects the issuer&rsquo;s records in real time.
      </p>
    </main>
  );
}

function Result({ tone, icon, title, subtitle }: { tone: "green" | "red" | "gray"; icon: string; title: string; subtitle: string }) {
  const map = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    gray: "border-slate-200 bg-slate-50 text-slate-600",
  } as const;
  return (
    <div className={`mt-8 rounded-2xl border p-6 ${map[tone]}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-xl">{icon}</div>
        <div>
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <div className="text-sm">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
