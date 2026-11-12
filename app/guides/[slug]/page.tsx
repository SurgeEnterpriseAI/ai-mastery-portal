import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDay } from "@/lib/curriculum";
import { GUIDES, getGuide, type GuideBlock } from "@/lib/guides";
import { COURSE_ID, ORG_ID, SITE, ldJson } from "@/lib/seo";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGuide(params.slug);
  if (!g) return {};
  const url = `${SITE}/guides/${g.slug}`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title: g.title, description: g.description, url, type: "article" },
  };
}

function Days({ from, to, detail }: { from: number; to: number; detail?: boolean }) {
  const days = [];
  for (let n = from; n <= to; n++) {
    const d = getDay(n);
    if (d) days.push(d);
  }
  return (
    <ol className="mt-4 space-y-5">
      {days.map((d) => (
        <li key={d.day} className="rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">
            <Link href={`/syllabus#day-${d.day}`} className="hover:underline">Day {d.day}: {d.title}</Link>
          </h3>
          {d.subtitle && <p className="mt-0.5 text-sm text-slate-600">{d.subtitle}</p>}
          {detail && d.learningObjectives?.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">You will learn to</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {d.learningObjectives.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </>
          )}
          {detail && d.homework && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Homework</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{d.homework}</p>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

function Block({ b }: { b: GuideBlock }) {
  if (b.kind === "p") return <p className="mt-3 leading-relaxed text-slate-700">{b.text}</p>;
  if (b.kind === "list")
    return <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
  if (b.kind === "checks")
    return (
      <div className="mt-4 space-y-4">
        {b.items.map((c) => (
          <section key={c.q} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900">{c.q}</h3>
            <p className="mt-1 leading-relaxed text-slate-700">{c.a}</p>
          </section>
        ))}
      </div>
    );
  return <Days from={b.from} to={b.to} detail={b.detail} />;
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) notFound();
  const url = `${SITE}/guides/${g.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: g.title,
        description: g.description,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", url: SITE, name: "Tensorpath" },
        about: { "@id": COURSE_ID },
        publisher: { "@id": ORG_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Tensorpath", item: SITE },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
          { "@type": "ListItem", position: 3, name: g.label, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  const others = GUIDES.filter((o) => o.slug !== g.slug);
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Tensorpath</Link>
        <span className="px-1.5">/</span>
        <Link href="/guides" className="hover:text-slate-900">Guides</Link>
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">{g.h1}</h1>
      {g.intro.map((p) => <p key={p} className="mt-3 leading-relaxed text-slate-700">{p}</p>)}

      {g.sections.map((s) => (
        <section key={s.heading} className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{s.heading}</h2>
          {s.blocks.map((b, i) => <Block key={i} b={b} />)}
        </section>
      ))}

      <h2 className="mt-10 text-xl font-bold text-slate-900">Questions</h2>
      <div className="mt-4 space-y-5 text-slate-700">
        {g.faqs.map((f) => (
          <section key={f.q}>
            <h3 className="font-bold text-slate-900">{f.q}</h3>
            <p className="mt-1 leading-relaxed">{f.a}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/join" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Enroll free →</Link>
        <Link href="/compare" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">Compare with IIT and IISc programmes</Link>
        <Link href="/syllabus" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">Full syllabus</Link>
        <Link href="/faq" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">FAQ</Link>
      </div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-slate-500">More guides</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {others.map((o) => <li key={o.slug}><Link href={`/guides/${o.slug}`} className="text-brand-600 hover:underline">{o.title}</Link></li>)}
      </ul>
    </main>
  );
}
