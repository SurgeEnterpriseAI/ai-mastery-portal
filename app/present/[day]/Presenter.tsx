"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import type { Day } from "@/lib/types";

type DeckItem =
  | { kind: "cover" }
  | { kind: "slide"; slideIndex: number }
  | { kind: "recap" };

export default function Presenter({
  day,
  isTrainer,
  resumeAt,
  cohortName,
  totalDays,
  hasNextDay,
}: {
  day: Day;
  isTrainer: boolean;
  resumeAt: number;
  cohortName: string;
  totalDays: number;
  hasNextDay: boolean;
}) {
  const router = useRouter();

  const deck = useMemo<DeckItem[]>(() => {
    const items: DeckItem[] = [{ kind: "cover" }];
    day.slides.forEach((_, i) => items.push({ kind: "slide", slideIndex: i }));
    items.push({ kind: "recap" });
    return items;
  }, [day]);

  const clamp = (n: number) => Math.max(0, Math.min(deck.length - 1, n));
  const [index, setIndex] = useState(clamp(resumeAt));
  const [showNotes, setShowNotes] = useState(false);
  const [finished, setFinished] = useState(false);
  const savedRef = useRef<number>(-1);

  // Persist the live cursor whenever the trainer moves (so the room resumes here).
  useEffect(() => {
    if (!isTrainer) return;
    if (savedRef.current === index) return;
    savedRef.current = index;
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentDay: day.day, currentSlide: index }),
    }).catch(() => {});
  }, [index, isTrainer, day.day]);

  const next = useCallback(() => setIndex((i) => clamp(i + 1)), [deck.length]);
  const prev = useCallback(() => setIndex((i) => clamp(i - 1)), [deck.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key.toLowerCase() === "n" && isTrainer) {
        setShowNotes((s) => !s);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, isTrainer]);

  async function finishDay() {
    if (isTrainer) {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "completeDay", day: day.day }),
      }).catch(() => {});
    }
    setFinished(true);
  }

  async function announceNext() {
    await fetch("/api/announce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: day.day + 1 }),
    }).catch(() => {});
    setFinished(false);
    router.push("/trainer");
    router.refresh();
  }

  const item = deck[index];
  const pct = Math.round(((index + 1) / deck.length) * 100);
  const slide = item.kind === "slide" ? day.slides[item.slideIndex] : null;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href={isTrainer ? "/trainer" : "/"} className="text-slate-500 hover:text-slate-900" title="Exit">
            ✕
          </Link>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-brand-600">
              {cohortName} · Day {day.day} of {totalDays}
            </div>
            <div className="text-sm font-bold text-slate-900">{day.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:block">
            {index + 1} / {deck.length}
          </span>
          {isTrainer && (
            <button
              onClick={() => setShowNotes((s) => !s)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                showNotes ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Toggle speaker notes (n)"
            >
              🗣 Notes
            </button>
          )}
        </div>
      </header>
      <div className="h-1 w-full bg-slate-100">
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Stage */}
      <main className="relative flex flex-1 items-stretch">
        <button
          onClick={prev}
          disabled={index === 0}
          className="absolute left-0 top-0 z-10 h-full w-16 text-2xl text-slate-900/20 transition hover:text-slate-900/70 disabled:opacity-0"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={next}
          disabled={index === deck.length - 1}
          className="absolute right-0 top-0 z-10 h-full w-16 text-2xl text-slate-900/20 transition hover:text-slate-900/70 disabled:opacity-0"
          aria-label="Next"
        >
          ›
        </button>

        <div className="mx-auto w-full max-w-4xl px-8 py-10">
          <div key={index} className="animate-fadein">
            {item.kind === "cover" && <Cover day={day} />}
            {item.kind === "slide" && slide && (
              <article>
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    {slide.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    Slide {item.slideIndex + 1} of {day.slides.length}
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900">{slide.title}</h1>
                <Markdown className="prose-slide mt-4 text-slate-700">{slide.body}</Markdown>
                {slide.marketConnection && (
                  <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent-700">📈 Market connection · 2026</div>
                    <p className="mt-1 text-sm text-slate-700">{slide.marketConnection}</p>
                  </div>
                )}
                {isTrainer && showNotes && slide.speakerNotes && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-700">🗣 Speaker notes</div>
                    <Markdown className="prose-compact mt-1 text-sm text-amber-900">{slide.speakerNotes}</Markdown>
                  </div>
                )}
              </article>
            )}
            {item.kind === "recap" && (
              <Recap day={day} isTrainer={isTrainer} hasNextDay={hasNextDay} onFinish={finishDay} />
            )}
          </div>
        </div>
      </main>

      {/* Bottom controls */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
        <button
          onClick={prev}
          disabled={index === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          ‹ Prev
        </button>
        <div className="text-xs text-slate-400">
          {isTrainer ? "Use ← → or Space. Press N for notes. The room auto-saves your place." : "Following along · use ← → to navigate"}
        </div>
        {index === deck.length - 1 ? (
          <Link
            href={isTrainer ? "/trainer" : "/"}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Done
          </Link>
        ) : (
          <button
            onClick={next}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Next ›
          </button>
        )}
      </footer>

      {/* Finish modal */}
      {finished && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Day {day.day} complete!</h2>
            <p className="mt-2 text-slate-600">
              The portal has marked Day {day.day} done and moved the class pointer to{" "}
              {hasNextDay ? `Day ${day.day + 1}` : "the finish line"}.
            </p>
            {isTrainer && hasNextDay && (
              <div className="mt-5 space-y-2">
                <button
                  onClick={announceNext}
                  className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700"
                >
                  📣 Email the class what&rsquo;s coming next
                </button>
                <Link
                  href={`/present/${day.day + 1}`}
                  className="block w-full rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Preview Day {day.day + 1} →
                </Link>
              </div>
            )}
            <Link
              href={isTrainer ? "/trainer" : "/"}
              className="mt-3 block text-sm text-slate-500 hover:text-slate-900"
            >
              Back to {isTrainer ? "console" : "home"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Cover({ day }: { day: Day }) {
  return (
    <div className="py-6">
      <div className="text-sm font-semibold uppercase tracking-widest text-accent-700">Day {day.day} · {day.duration}</div>
      <h1 className="mt-2 text-5xl font-extrabold leading-tight text-slate-900">{day.title}</h1>
      <p className="mt-3 text-xl text-slate-600">{day.subtitle}</p>
      <p className="mt-1 text-sm italic text-brand-700">{day.theme}</p>

      <blockquote className="mt-8 rounded-2xl border-l-4 border-brand-500 bg-slate-50 p-6 text-lg leading-relaxed text-slate-800">
        {day.storyHook}
      </blockquote>

      <div className="mt-8">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">By the end of today you&rsquo;ll be able to</div>
        <ul className="mt-3 space-y-2">
          {day.learningObjectives.map((o, i) => (
            <li key={i} className="flex gap-3 text-slate-700">
              <span className="text-brand-600">→</span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Recap({
  day,
  isTrainer,
  hasNextDay,
  onFinish,
}: {
  day: Day;
  isTrainer: boolean;
  hasNextDay: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="py-6">
      <div className="text-sm font-semibold uppercase tracking-widest text-accent-700">Wrap-up · Day {day.day}</div>
      <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Key takeaways</h1>
      <ul className="mt-4 space-y-2">
        {day.keyTakeaways.map((t, i) => (
          <li key={i} className="flex gap-3 text-lg text-slate-800">
            <span className="text-emerald-700">✓</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-accent-700">📈 Market snapshot · June 2026</div>
          <p className="mt-2 text-sm text-slate-700">{day.marketSnapshot2026}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">📝 Homework</div>
          <p className="mt-2 text-sm text-slate-700">{day.homework}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-brand-700">🔮 Coming up next</div>
        <p className="mt-2 text-slate-800">{day.nextDayTeaser}</p>
      </div>

      {isTrainer && (
        <button
          onClick={onFinish}
          className="mt-8 w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white hover:bg-emerald-700"
        >
          ✓ Mark Day {day.day} complete{hasNextDay ? " & advance the class" : ""}
        </button>
      )}
    </div>
  );
}
