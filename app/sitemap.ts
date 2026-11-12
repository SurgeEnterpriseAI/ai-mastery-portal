import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";

const SITE = "https://tensorpath.in";

/** Commit date baked in at build (next.config.js), so lastmod only moves when the site changes; omitted if unknown. */
const COMMIT_DATE = process.env.SITE_COMMIT_DATE || "";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = COMMIT_DATE && !Number.isNaN(Date.parse(COMMIT_DATE)) ? new Date(COMMIT_DATE) : undefined;
  const pages: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, freq: "weekly" },
    { path: "/careers", priority: 0.9, freq: "daily" },
    { path: "/syllabus", priority: 0.9, freq: "monthly" },
    { path: "/faq", priority: 0.8, freq: "monthly" },
    { path: "/compare", priority: 0.7, freq: "monthly" },
    { path: "/guides", priority: 0.7, freq: "monthly" },
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}`, priority: 0.7, freq: "monthly" as const })),
    { path: "/ai-track", priority: 0.8, freq: "weekly" },
    { path: "/enquiry", priority: 0.7, freq: "monthly" },
    { path: "/join", priority: 0.7, freq: "monthly" },
    { path: "/verify", priority: 0.5, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
  ];
  // The /present/N slide pages stay public but are not listed: they are thin slide decks. /syllabus has the
  // same 20 days as text.
  return pages.map((p) => ({
    url: `${SITE}${p.path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
