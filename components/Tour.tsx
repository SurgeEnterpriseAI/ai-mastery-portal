"use client";

import { useCallback, useEffect, useState } from "react";

export interface TourStep {
  target?: string; // CSS selector to spotlight; omit for a centered step
  title: string;
  body: string;
}

interface Rect { top: number; left: number; width: number; height: number }

/**
 * Lightweight guided tour: dims the page, spotlights the target element, and
 * shows a step card with Back / Next. Auto-runs once per browser (localStorage),
 * and a floating "Take a tour" pill lets anyone replay it.
 */
export default function Tour({ steps, storageKey, label = "Take a tour" }: { steps: TourStep[]; storageKey: string; label?: string }) {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const key = `aimp_tour_${storageKey}`;

  // auto-start once per browser
  useEffect(() => {
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(t);
    }
  }, [key]);

  const measure = useCallback(() => {
    const step = steps[i];
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 300);
  }, [i, steps]);

  useEffect(() => {
    if (!active) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, i, measure]);

  function finish() {
    localStorage.setItem(key, "done");
    setActive(false);
    setI(0);
    setRect(null);
  }
  const next = () => (i < steps.length - 1 ? setI(i + 1) : finish());
  const back = () => setI(Math.max(0, i - 1));

  function start() {
    setI(0);
    setActive(true);
  }

  if (!active) {
    return (
      <button
        onClick={start}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-card hover:bg-slate-50"
        aria-label={label}
      >
        <span>💡</span> {label}
      </button>
    );
  }

  const step = steps[i];
  const pad = 8;

  // card position: below the target if room, else above; centered if no target
  let cardStyle: React.CSSProperties = {};
  if (rect) {
    const vh = window.innerHeight;
    const below = rect.top + rect.height < vh * 0.62;
    const left = Math.min(Math.max(rect.left, 16), window.innerWidth - 376);
    cardStyle = below
      ? { top: rect.top + rect.height + 16, left }
      : { bottom: vh - rect.top + 16, left };
  } else {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* backdrop — dim everything; clicking advances */}
      <div
        onClick={next}
        className="absolute inset-0"
        style={{ background: rect ? "transparent" : "rgba(15,23,42,0.5)" }}
      />
      {/* spotlight cutout via large box-shadow */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
            outline: "2px solid #2563eb",
            outlineOffset: "2px",
            transition: "all 0.2s ease",
          }}
        />
      )}

      {/* step card */}
      <div key={i} className="animate-fadein fixed z-[62] w-[344px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-cardhover" style={cardStyle}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Step {i + 1} of {steps.length}</span>
          <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-700">Skip</button>
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-900">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, n) => (
              <span key={n} className={`h-1.5 w-1.5 rounded-full ${n === i ? "bg-brand-600" : "bg-slate-300"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={back} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Back
              </button>
            )}
            <button onClick={next} className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
              {i < steps.length - 1 ? "Next" : "Got it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
