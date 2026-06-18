"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", background: "", goals: "", level: "beginner" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/learner/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/learn");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || "Sign up failed");
    }
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500";
  const label = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Name</label>
          <input value={f.name} onChange={set("name")} className={input} required />
        </div>
        <div>
          <label className={label}>Email</label>
          <input type="email" value={f.email} onChange={set("email")} className={input} required />
        </div>
      </div>
      <div>
        <label className={label}>Password</label>
        <input type="password" value={f.password} onChange={set("password")} className={input} minLength={6} required />
      </div>
      <div>
        <label className={label}>Your background</label>
        <textarea value={f.background} onChange={set("background")} rows={2} placeholder="e.g. Backend dev, new to ML" className={input} />
      </div>
      <div>
        <label className={label}>Your goal with AI</label>
        <textarea value={f.goals} onChange={set("goals")} rows={2} placeholder="e.g. Build and ship an AI agent for my company" className={input} />
      </div>
      <div>
        <label className={label}>Current level</label>
        <select value={f.level} onChange={set("level")} className={input}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {loading ? "Creating your journey…" : "Create my account →"}
      </button>
      <p className="text-center text-xs text-slate-400">Your profile personalises everything your AI coach tells you.</p>
    </form>
  );
}
