"use client";

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

/**
 * Vertical, self-scrolling "Latest in AI" rail for the right side of the page.
 * The cards glide upward on their own (paused on hover), so a visitor sees the
 * full set without ever scrolling the rail itself. The list is duplicated so the
 * loop is seamless.
 */
export default function InnovationsRail({ items, updatedAt }: { items: Item[]; updatedAt: string }) {
  if (!items?.length) return null;
  const loop = [...items, ...items];
  const updated = prettyDate(updatedAt);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-slate-900">🚀 Latest in AI</h2>
        <p className="mt-0.5 text-xs text-slate-500">Gemini-researched, Claude-verified{updated ? ` · ${updated}` : ""}</p>
      </div>
      <div className="group relative flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_5%,#000_95%,transparent)]">
        <div className="flex animate-vscroll flex-col gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {loop.map((it, i) => (
            <a
              key={i}
              href={it.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden={i >= items.length ? true : undefined}
              tabIndex={i >= items.length ? -1 : undefined}
              className="block shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-cardhover"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CAT_STYLE[it.category] || CAT_STYLE.Industry}`}>{it.category}</span>
                <span className="text-[10px] text-slate-400">{prettyDate(it.date)}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold leading-snug text-slate-900">{it.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{it.summary}</p>
              <span className="mt-2 inline-block text-[11px] font-semibold text-brand-600">{it.sourceName} →</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
