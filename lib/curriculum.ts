import type { Day, DayMeta } from "./types";
import { DAYS } from "@/content/curriculum";

export const TOTAL_DAYS = 20;

// Statically-imported curriculum (bundled — works on Vercel's read-only FS).
const byDay = new Map<number, Day>(DAYS.filter((d) => d && typeof d.day === "number").map((d) => [d.day, d]));

export function getDay(day: number): Day | null {
  return byDay.get(day) || null;
}

export function getAllDayMeta(): DayMeta[] {
  const metas: DayMeta[] = [];
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const day = byDay.get(d);
    if (day) {
      metas.push({
        day: day.day,
        title: day.title,
        subtitle: day.subtitle,
        theme: day.theme,
        duration: day.duration,
        slideCount: day.slides?.length || 0,
      });
    } else {
      metas.push({ day: d, title: `Day ${d}`, subtitle: "Content loading…", theme: "", duration: "", slideCount: 0 });
    }
  }
  return metas;
}

export function availableDayCount(): number {
  return byDay.size;
}

export function allDays(): Day[] {
  return DAYS;
}
