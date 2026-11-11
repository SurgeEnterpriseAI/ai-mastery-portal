import Link from "next/link";
import type { Metadata } from "next";
import { faqItems, faqJsonLd } from "@/lib/faq";
import { ldJson } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FAQ — price, duration, format and certificate",
  description:
    "Answers about Tensorpath's 20-day AI course: what it costs to enrol, how long it takes, how the live classes and AI companion work, and how the verifiable certificate is earned.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "Tensorpath FAQ", description: "Price, duration, format and certificate of the 20-day AI course.", url: "https://tensorpath.in/faq" },
};

export default function FaqPage() {
  const items = faqItems();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd()) }} />
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to Tensorpath</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Frequently asked questions</h1>
      <p className="mt-2 text-slate-600">
        About the 20-day Tensorpath AI course. The full day-by-day list is on the{" "}
        <Link href="/syllabus" className="text-brand-600 hover:underline">syllabus</Link> page.
      </p>
      <div className="mt-8 space-y-6 text-slate-700">
        {items.map((f) => (
          <section key={f.q}>
            <h2 className="text-lg font-bold text-slate-900">{f.q}</h2>
            <p className="mt-1.5 leading-relaxed">{f.a}</p>
          </section>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
        <Link href="/enquiry" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">Talk to us</Link>
      </div>
    </main>
  );
}
