"use client";

import { useRef } from "react";

interface Item {
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  date: string;
}

const CAT_STYLE: Record<string, string> = {
  Models: "bg-brand-50 text-brand-700 border-brand-200",
  Agents: "bg-violet-50 text-violet-700 border-violet-200",
  Tools: "bg-amber-50 text-amber-700 border-amber-200",
  Research: "bg-accent-50 text-accent-700 border-accent-200",
  "Open Source": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Multimodal: "bg-pink-50 text-pink-700 border-pink-200",
  Industry: "bg-slate-100 text-slate-600 border-slate-200",
};

function prettyDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InnovationsCarousel({ items, updatedAt }: { items: Item[]; updatedAt: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  if (!items?.length) return null;

  const scroll = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };
  const updated = prettyDate(updatedAt);

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">🚀 Latest in AI</h2>
          <p className="mt-1 text-slate-500">
            Fresh from the field — researched by Gemini, fact-checked by Claude. The world you&rsquo;re training for{updated ? `, updated ${updated}` : ""}.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} aria-label="Previous" className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">←</button>
          <button onClick={() => scroll(1)} aria-label="Next" className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">→</button>
        </div>
      </div>

      <div
        ref={scroller}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
      >
        {items.map((it, i) => (
          <a
            key={i}
            href={it.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-[280px] shrink-0 snap-start flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-cardhover"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CAT_STYLE[it.category] || CAT_STYLE.Industry}`}>{it.category}</span>
              <span className="text-xs text-slate-400">{prettyDate(it.date)}</span>
            </div>
            <h3 className="mt-3 font-bold leading-snug text-slate-900 group-hover:text-brand-700">{it.title}</h3>
            <p className="mt-2 flex-1 text-sm text-slate-600">{it.summary}</p>
            <span className="mt-3 text-xs font-semibold text-brand-600">{it.sourceName} →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
