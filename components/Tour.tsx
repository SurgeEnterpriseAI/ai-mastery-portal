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

  // read the target's current position without moving the page
  const measureRect = useCallback(() => {
    const step = steps[i];
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [i, steps]);

  // when the step changes, scroll the target into view once, then measure
  useEffect(() => {
    if (!active) return;
    const step = steps[i];
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    // tall sections (taller than the viewport) align to top so the card has room;
    // everything else centers
    const block = el.getBoundingClientRect().height > window.innerHeight * 0.85 ? "start" : "center";
    el.scrollIntoView({ behavior: "smooth", block });
    const t = setTimeout(measureRect, 350);
    return () => clearTimeout(t);
  }, [active, i, steps, measureRect]);

  // keep the spotlight aligned while the page scrolls/resizes — do NOT re-scroll
  useEffect(() => {
    if (!active) return;
    const onChange = () => measureRect();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [active, measureRect]);

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

  // card position: below the target's visible bottom if there's room, else above
  // its visible top, else centered on-screen. Always clamped into the viewport so
  // the card never slides off (e.g. when the target is taller than the screen).
  let cardStyle: React.CSSProperties = {};
  if (rect) {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const cardW = 344;
    const estCardH = 240;
    const left = Math.min(Math.max(rect.left, 16), vw - cardW - 16);
    const visTop = Math.max(rect.top, 16);
    const visBottom = Math.min(rect.top + rect.height, vh - 16);
    if (visBottom + 16 + estCardH <= vh - 16) {
      cardStyle = { top: visBottom + 16, left }; // below the visible bottom
    } else if (visTop - 16 - estCardH >= 16) {
      cardStyle = { top: visTop - 16 - estCardH, left }; // above the visible top
    } else {
      cardStyle = { top: Math.max(16, (vh - estCardH) / 2), left }; // target fills screen → center, on-screen
    }
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

      {/* step card — solid brand coach-mark so it stands out from the light page */}
      <div key={i} className="animate-fadein fixed z-[62] w-[344px] max-w-[calc(100vw-32px)] rounded-2xl border border-brand-700 bg-brand-600 p-5 text-white shadow-cardhover ring-4 ring-brand-600/20" style={cardStyle}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-100">Step {i + 1} of {steps.length}</span>
          <button onClick={finish} className="text-xs text-brand-100 hover:text-white">Skip</button>
        </div>
        <h3 className="mt-2 text-lg font-bold text-white">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-brand-50">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, n) => (
              <span key={n} className={`h-1.5 w-1.5 rounded-full ${n === i ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={back} className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10">
                Back
              </button>
            )}
            <button onClick={next} className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              {i < steps.length - 1 ? "Next" : "Got it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
