"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CapstoneForm({ totalDays }: { totalDays: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (desc.trim().length < 40) return setError("Please describe what you built in a few sentences.");
    setError("");
    setBusy(true);
    const res = await fetch("/api/certificate/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capstoneTitle: title, capstoneDescription: desc }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(d.error || "Could not issue certificate.");
    }
  }

  const input = "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-brand-500";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/learn" className="text-sm text-gray-400 hover:text-white">← Back to dashboard</Link>
      <div className="mt-4 rounded-2xl border border-brand-500/30 bg-panel/70 p-7">
        <div className="text-4xl">🎓</div>
        <h1 className="mt-3 text-3xl font-extrabold text-white">Claim your certificate</h1>
        <p className="mt-2 text-gray-300">
          You&rsquo;ve completed all {totalDays} days — congratulations! Tell us about your <strong className="text-white">capstone project</strong>:
          what did you build with what you learned? Your coach will turn it into a clear one-page summary that&rsquo;s printed on
          your certificate and shown on its public verification page, so any organization can see exactly what you did.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Capstone title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A RAG assistant for our support docs" className={input} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">What did you build? Be concrete.</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={7}
              placeholder="Describe the problem, what you built, the AI techniques you used (e.g. embeddings + retrieval, fine-tuning, an agent with tools), and the outcome…"
              className={input}
              required
            />
            <div className="mt-1 text-xs text-gray-500">{desc.trim().length} characters</div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
            {busy ? "Generating your certificate…" : "🎓 Generate & issue my certificate"}
          </button>
        </form>
      </div>
    </main>
  );
}
