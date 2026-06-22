"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrainerResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => { router.push("/trainer"); router.refresh(); }, 1200);
    } else {
      setError((await res.json().catch(() => ({}))).error || "Could not reset password.");
    }
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500";

  if (done) return <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">✓ Password updated — signing you in…</div>;

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">New password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={input} required />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
