"use client";

import { useState } from "react";

const BACKGROUNDS = [
  { v: "student", label: "Student" },
  { v: "working_professional", label: "Working professional" },
  { v: "surge_track", label: "On an Adobe / SAP / Salesforce track" },
  { v: "other", label: "Other" },
];

/**
 * Public enquiry form (Module A). `source` is passed in by the page — the
 * /ai-track cross-sell page sets it to "surge", organic pages leave it blank.
 */
export default function EnquiryForm({ source = "", defaultBackground = "" }: { source?: string; defaultBackground?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [background, setBackground] = useState(defaultBackground || "student");
  const [interest, setInterest] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!consent) { setErr("Please tick the consent box so we can contact you."); return; }
    setBusy(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, background, interest, heardFrom, consent, src: source }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) setDone(true);
    else setErr(d.error || "Something went wrong. Please try again.");
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-3xl">✅</div>
        <h3 className="mt-2 text-lg font-bold text-slate-900">Thanks — we&rsquo;ve got your enquiry!</h3>
        <p className="mt-1 text-sm text-slate-600">Our team will reach out shortly. Check your inbox for a confirmation.</p>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-brand-500";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-700">Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={input} placeholder="Your name" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={input} placeholder="+91 9xxxxxxxxx" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Your background</label>
        <select value={background} onChange={(e) => setBackground(e.target.value)} className={input}>
          {BACKGROUNDS.map((b) => <option key={b.v} value={b.v}>{b.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">What do you want from AI training? <span className="text-slate-400">(optional)</span></label>
        <textarea value={interest} onChange={(e) => setInterest(e.target.value)} rows={2} className={input} placeholder="e.g. switch into an AI role, add AI to my current skills…" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">How did you hear about us? <span className="text-slate-400">(optional)</span></label>
        <input value={heardFrom} onChange={(e) => setHeardFrom(e.target.value)} className={input} placeholder="Surge, a friend, LinkedIn…" />
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" />
        <span>I agree to be contacted by Tensorpath about AI training, and accept the{" "}
          <a href="/privacy" target="_blank" className="text-brand-600 hover:underline">Privacy Policy</a> and{" "}
          <a href="/terms" target="_blank" className="text-brand-600 hover:underline">Terms</a>.</span>
      </label>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {busy ? "Submitting…" : "Request a callback →"}
      </button>
    </form>
  );
}
