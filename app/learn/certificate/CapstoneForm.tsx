"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CapstoneForm({
  totalDays, initial, feedback,
}: {
  totalDays: number;
  initial?: { title: string; description: string; links: string[]; fileUrl?: string };
  feedback?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [links, setLinks] = useState((initial?.links || []).join("\n"));
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (desc.trim().length < 40) return setError("Please describe what you built in a few sentences.");
    setError("");
    setBusy(true);
    const res = await fetch("/api/capstone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, links, fileUrl }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(d.error || "Could not submit your capstone.");
  }

  const input = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-brand-500";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/learn" className="text-sm text-slate-500 hover:text-slate-900">← Back to dashboard</Link>
      <div className="mt-4 rounded-2xl border border-brand-200 bg-white p-7">
        <div className="text-4xl">🎓</div>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">{feedback ? "Revise & resubmit your capstone" : "Submit your capstone"}</h1>
        <p className="mt-2 text-slate-600">
          You&rsquo;ve completed all {totalDays} days — congratulations! Submit your <strong className="text-slate-900">capstone project</strong> for trainer review.
          Once approved, your certificate is issued automatically with a clear one-page summary on its public verification page.
        </p>

        {feedback && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="font-semibold">Revisions requested by your trainer:</div>
            <div className="mt-1 whitespace-pre-wrap">{feedback}</div>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Capstone title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A RAG assistant for our support docs" className={input} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">What did you build? Be concrete.</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={7}
              placeholder="Describe the problem, what you built, the AI techniques you used (embeddings + retrieval, fine-tuning, an agent with tools…), and the outcome…"
              className={input} required />
            <div className="mt-1 text-xs text-slate-400">{desc.trim().length} characters</div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Links — GitHub, live demo (one per line)</label>
            <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder="https://github.com/you/project&#10;https://your-demo.vercel.app" className={input} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attachment URL <span className="text-slate-400">(optional — slides/doc link)</span></label>
            <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" className={input} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {busy ? "Submitting…" : "📤 Submit for review"}
          </button>
        </form>
      </div>
    </main>
  );
}
