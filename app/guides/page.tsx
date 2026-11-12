import Link from "next/link";
import type { Metadata } from "next";
import { TOTAL_DAYS } from "@/lib/curriculum";
import { GUIDES } from "@/lib/guides";
import { SITE, ldJson } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Guides: learning AI from transformers to AI agents",
  description:
    "Plain answers about learning modern AI: what to learn in what order from transformers to AI agents, what to look for in a live AI course with a certificate in India, and each stage of the Tensorpath course.",
  alternates: { canonical: "/guides" },
  openGraph: { title: "Tensorpath guides", description: "Learning AI from transformers to AI agents, stage by stage.", url: `${SITE}/guides` },
};

export default function GuidesIndex() {
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/guides#webpage`,
        url: `${SITE}/guides`,
        name: "Tensorpath guides",
        inLanguage: "en",
        hasPart: GUIDES.map((g) => ({ "@type": "WebPage", url: `${SITE}/guides/${g.slug}`, name: g.title })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Tensorpath", item: SITE },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
        ],
      },
    ],
  };
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to Tensorpath</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Guides: learning AI from transformers to AI agents</h1>
      <p className="mt-2 text-slate-600">
        Answers to common questions before choosing an AI course, based on the {TOTAL_DAYS}-day Tensorpath syllabus. For
        Tensorpath next to IIT and IISc certificate programmes, see the{" "}
        <Link href="/compare" className="text-brand-600 hover:underline">compare</Link> page.
      </p>
      <ul className="mt-8 space-y-5">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <h2 className="text-lg font-bold text-slate-900">
              <Link href={`/guides/${g.slug}`} className="hover:underline">{g.title}</Link>
            </h2>
            <p className="mt-1 text-slate-600">{g.description}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
        <Link href="/syllabus" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">Syllabus</Link>
        <Link href="/faq" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">FAQ</Link>
      </div>
    </main>
  );
}
