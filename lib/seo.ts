import { getAllDayMeta, getDay } from "@/lib/curriculum";

// Structured data (schema.org JSON-LD) for search and AI engines.
// Everything here is taken from what the site already states publicly —
// no invented prices, dates or names.

export const SITE = "https://tensorpath.in";
export const COURSE_ID = `${SITE}/#course`;
export const ORG_ID = `${SITE}/#organization`;

export const PROVIDER = {
  "@type": "EducationalOrganization",
  "@id": ORG_ID,
  name: "Tensorpath",
  url: SITE,
  parentOrganization: { "@type": "Organization", name: "Surge Software Solutions Pvt. Ltd." },
};

/** "60 minutes" -> "PT60M"; anything unparseable -> undefined. */
function isoDuration(text: string): string | undefined {
  const m = /^(\d+)\s*min/i.exec(text.trim());
  if (m) return `PT${m[1]}M`;
  const h = /^(\d+(?:\.\d+)?)\s*h/i.exec(text.trim());
  if (h) return `PT${Math.round(Number(h[1]) * 60)}M`;
  return undefined;
}

export function lessonUrl(day: number): string {
  return `${SITE}/present/${day}`;
}

/** Days whose material actually exists (the rest are placeholders). */
export function publishedDays() {
  return getAllDayMeta().filter((d) => d.slideCount > 0);
}

export function courseJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": COURSE_ID,
    name: "Tensorpath — 20-Day AI Training",
    description:
      "A 20-day, instructor-led AI program from the 2017 Transformer paper to today's reasoning models and AI agents, with Genie — your personal AI learning companion — a capstone project, a verifiable certificate, and placement support.",
    url: SITE,
    inLanguage: "en",
    provider: PROVIDER,
    educationalLevel: "Beginner to Advanced",
    teaches: ["Transformers", "Large language models", "Prompt engineering", "RAG", "Fine-tuning & LoRA", "AI agents & tool use", "Multimodal AI", "Shipping AI"],
    educationalCredentialAwarded: "Verifiable Tensorpath certificate (on completing the capstone project)",
    hasCourseInstance: [{
      "@type": "CourseInstance",
      courseMode: "Blended",
      courseWorkload: "P20D",
      instructor: { "@type": "Person", name: "Tensorpath expert trainer" },
    }],
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock", category: "Free to begin" },
    syllabusSections: publishedDays().map((d) => ({
      "@type": "Syllabus",
      name: `Day ${d.day}: ${d.title}`,
      description: d.subtitle,
      url: lessonUrl(d.day),
      ...(isoDuration(d.duration) ? { timeRequired: isoDuration(d.duration) } : {}),
    })),
  };
}

/** ItemList of the course's day-by-day lessons (the home page lists them). */
export function lessonListJsonLd() {
  const days = publishedDays();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tensorpath 20-day AI curriculum",
    numberOfItems: days.length,
    itemListElement: days.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: lessonUrl(d.day),
      name: `Day ${d.day}: ${d.title}`,
    })),
  };
}

export function lessonJsonLd(dayNum: number) {
  const day = getDay(dayNum);
  if (!day) return null;
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `Day ${day.day}: ${day.title}`,
    description: day.subtitle,
    url: lessonUrl(day.day),
    inLanguage: "en",
    learningResourceType: "Lesson",
    position: day.day,
    ...(isoDuration(day.duration) ? { timeRequired: isoDuration(day.duration) } : {}),
    ...(day.learningObjectives?.length ? { teaches: day.learningObjectives } : {}),
    isPartOf: { "@type": "Course", "@id": COURSE_ID, name: "Tensorpath — 20-Day AI Training", url: SITE },
    provider: PROVIDER,
  };
}

/** Safe for dangerouslySetInnerHTML inside <script>: escapes "<" so content can't close the tag. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
