"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SigninForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/learner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/learn");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || "Sign in failed");
    }
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} required />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} required />
        <div className="mt-1.5 text-right">
          <Link href="/forgot" className="text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
