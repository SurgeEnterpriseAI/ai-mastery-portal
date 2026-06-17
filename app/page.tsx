import Link from "next/link";
import { getAllDayMeta, availableDayCount, TOTAL_DAYS } from "@/lib/curriculum";

export const dynamic = "force-dynamic";

export default function Home() {
  const days = getAllDayMeta();
  const ready = availableDayCount();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-2xl">🧠</div>
          <div>
            <div className="text-sm uppercase tracking-widest text-brand-400">Surge Software · AI Academy</div>
            <div className="text-lg font-bold">AI Mastery Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold text-gray-200 transition hover:bg-white/5"
          >
            Trainer Login
          </Link>
          <Link
            href="/join"
            className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-500"
          >
            Learn with an AI coach →
          </Link>
        </div>
      </header>

      <section className="mt-16 animate-fadein">
        <p className="text-accent font-semibold">A 20-day journey · From the 2017 paper to the June 2026 frontier</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-extrabold leading-tight text-white">
          From <span className="text-brand-400">&ldquo;Attention Is All You Need&rdquo;</span> to the age of AI agents.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-gray-300">
          A story-driven curriculum that takes a senior trainer — and the rooms they teach — from the very first spark
          of the Transformer all the way to today&rsquo;s reasoning models, multimodal systems, and agentic AI. Every
          day builds on the last, connects to what&rsquo;s happening in the market <strong>right now</strong>, and is
          ready to present live.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Stat label="Days" value={`${TOTAL_DAYS}`} />
          <Stat label="Days ready" value={`${ready}/${TOTAL_DAYS}`} />
          <Stat label="Format" value="Live + self-advancing" />
          <Stat label="Current as of" value="June 2026" />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-white">The 20-day arc</h2>
        <p className="mt-1 text-gray-400">Each card is a full, presentation-ready day with speaker notes and market context.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <div
              key={d.day}
              className="rounded-2xl border border-white/10 bg-panel/70 p-5 transition hover:border-brand-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Day {d.day}</span>
                {d.slideCount > 0 ? (
                  <span className="text-xs text-gray-500">{d.slideCount} slides</span>
                ) : (
                  <span className="text-xs text-amber-400">loading…</span>
                )}
              </div>
              <h3 className="mt-2 font-bold text-white">{d.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{d.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t border-white/10 pt-6 text-sm text-gray-500">
        Built for trainers who want to teach AI en masse — clearly, vividly, and current to the day.
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel/60 px-5 py-3">
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
    </div>
  );
}
