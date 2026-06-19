import Link from "next/link";
import type { Metadata } from "next";
import { TOTAL_DAYS, availableDayCount } from "@/lib/curriculum";
import EnquiryForm from "@/components/EnquiryForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add AI to your career — 20-day AI training with placement support",
  description:
    "Already exploring Adobe, SAP or Salesforce? Add AI in 20 days. Tensorpath is an instructor-led AI program with a personal AI coach, a verifiable certificate, and placement support. Free to begin.",
  alternates: { canonical: "/ai-track" },
  openGraph: { title: "Add AI to your career — Tensorpath", description: "20-day instructor-led AI training with placement support. Free to begin.", url: "https://tensorpath.in/ai-track" },
};

const ADDS = [
  { icon: "🧠", title: "A skill the market is paying for", body: "AI/LLM skills sit on top of whatever stack you already know — Adobe, SAP, Salesforce or any domain — and make your profile far more hireable." },
  { icon: "🎓", title: "20 days, instructor-led", body: "Learn live with an expert trainer plus a personal AI coach — from the 2017 Transformer to today's agents, RAG and reasoning models." },
  { icon: "✅", title: "A verifiable certificate", body: "Finish a capstone and earn a credential any employer can verify — proof you can actually build with AI." },
  { icon: "💼", title: "Placement support", body: "Job roles, market openings, salary insight and interview prep — we help you turn the certificate into an offer." },
];

export default function AiTrackPage() {
  const ready = availableDayCount();
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🧠</div>
          <div>
            <div className="text-sm uppercase tracking-widest text-brand-600">Add AI to your track</div>
            <div className="text-lg font-bold text-slate-900">Tensorpath</div>
          </div>
        </Link>
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
      </header>

      <section className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="font-semibold text-brand-600">Already exploring an Adobe / SAP / Salesforce track?</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-slate-900">
            Add <span className="text-brand-600">AI</span> to your profile — in 20 days.
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            Whatever track brought you to Surge, AI is the multiplier on top of it. Tensorpath is a guided,
            instructor-led journey from AI fundamentals to building real applications — ending in a verifiable
            certificate and placement support.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ADDS.map((a) => (
              <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="text-2xl">{a.icon}</div>
                <h3 className="mt-2 font-bold text-slate-900">{a.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{a.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
              <div className="text-2xl font-extrabold text-slate-900">{TOTAL_DAYS}</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Days</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
              <div className="text-2xl font-extrabold text-slate-900">{ready}/{TOTAL_DAYS}</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Lessons ready</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
              <div className="text-2xl font-extrabold text-slate-900">Live</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">+ AI-coached</div>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            See the full <Link href="/" className="text-brand-600 hover:underline">20-day curriculum</Link> · already decided?{" "}
            <Link href="/join" className="text-brand-600 hover:underline">enroll free</Link>.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 lg:sticky lg:top-8">
          <h2 className="text-xl font-extrabold text-slate-900">Talk to us about the AI track</h2>
          <p className="mt-1 text-sm text-slate-600">Leave your details and our team will guide you on the best fit. It&rsquo;s free to begin.</p>
          <div className="mt-5">
            <EnquiryForm source="surge" defaultBackground="surge_track" />
          </div>
        </div>
      </section>
    </main>
  );
}
