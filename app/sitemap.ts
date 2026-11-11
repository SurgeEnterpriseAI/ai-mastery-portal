import type { MetadataRoute } from "next";
import { publishedDays } from "@/lib/seo";

const SITE = "https://tensorpath.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, freq: "weekly" },
    { path: "/careers", priority: 0.9, freq: "daily" },
    { path: "/ai-track", priority: 0.8, freq: "weekly" },
    { path: "/enquiry", priority: 0.7, freq: "monthly" },
    { path: "/join", priority: 0.7, freq: "monthly" },
    { path: "/verify", priority: 0.5, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
  ];
  // Day-by-day lessons: public slide pages (render without login), one per published day.
  for (const d of publishedDays()) pages.push({ path: `/present/${d.day}`, priority: 0.6, freq: "monthly" });
  return pages.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
