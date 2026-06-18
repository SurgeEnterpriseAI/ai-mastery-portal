"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Capstone } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-brand-50 text-brand-700",
  under_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  revisions: "bg-red-50 text-red-700",
};

export default function AdminCapstones({ capstones }: { capstones: Capstone[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Capstone review queue</h2>
      <p className="mt-0.5 text-sm text-slate-500">Score against the rubric, then approve (auto-issues the certificate) or request revisions.</p>
      <div className="mt-4 space-y-4">
        {capstones.length === 0 && <p className="text-sm text-slate-400">No capstones submitted yet.</p>}
        {capstones.map((c) => <Review key={c.id} cap={c} />)}
      </div>
    </div>
  );
}

const CRITERIA = [
  { key: "understanding", label: "Understanding" },
  { key: "implementation", label: "Implementation" },
  { key: "completeness", label: "Completeness" },
  { key: "presentation", label: "Presentation" },
] as const;

function Review({ cap }: { cap: Capstone }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({
    understanding: cap.scoreUnderstanding || 0, implementation: cap.scoreImplementation || 0,
    completeness: cap.scoreCompleteness || 0, presentation: cap.scorePresentation || 0,
  });
  const [comments, setComments] = useState(cap.comments || "");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function review(status: string) {
    setBusy(status); setMsg("");
    const res = await fetch("/api/admin/capstone", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: cap.learnerId, status, comments, scores }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy("");
    if (res.ok) {
      setMsg(status === "approved" ? `Approved — certificate ${d.credentialId || "issued"}.` : "Saved.");
      router.refresh();
    } else setMsg(d.error || "Failed.");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-900">{cap.title}</span>
          <span className="ml-2 text-sm text-slate-500">by {cap.learnerName}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[cap.status]}`}>{cap.status.replace("_", " ")}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{cap.description}</p>
      {(cap.links.length > 0 || cap.fileUrl) && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {cap.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{l}</a>)}
          {cap.fileUrl && <a href={cap.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">attachment ↗</a>}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CRITERIA.map((c) => (
          <label key={c.key} className="text-xs text-slate-500">
            {c.label}
            <select value={scores[c.key]} onChange={(e) => setScores({ ...scores, [c.key]: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800">
              {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? "—" : `${n}/5`}</option>)}
            </select>
          </label>
        ))}
      </div>
      <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} placeholder="Feedback / revision notes (shown to the learner)" className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500" />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => review("under_review")} disabled={!!busy} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Mark reviewing</button>
        <button onClick={() => review("revisions")} disabled={!!busy} className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50">Request revisions</button>
        <button onClick={() => review("approved")} disabled={!!busy} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{busy === "approved" ? "Approving…" : "Approve → issue cert"}</button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}
