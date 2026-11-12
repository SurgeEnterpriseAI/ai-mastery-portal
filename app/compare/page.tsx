import Link from "next/link";
import type { Metadata } from "next";
import { TOTAL_DAYS } from "@/lib/curriculum";
import { ldJson } from "@/lib/seo";

export const dynamic = "force-static";

// One comparison page for "Tensorpath vs Great Learning / TalentSprint / IIT certificate". Every rival fact was read
// on that programme's own page on 12 Nov 2026 (SOURCES below). Tensorpath facts restate /faq and /syllabus. No
// Tensorpath price is stated here on purpose: see /faq.

const CHECKED = "12 November 2026";

const SOURCES = [
  { label: "Great Learning: Certificate in Generative AI, IIT Bombay", url: "https://www.mygreatlearning.com/iit-bombay-certificate-generative-ai" },
  { label: "TalentSprint: Advanced Certification in Agentic and Generative AI, CCE-IISc (FAQ)", url: "https://iisc.talentsprint.com/agentic-and-generative-ai/faq.html" },
  { label: "TalentSprint: the same programme's fee page", url: "https://iisc.talentsprint.com/agentic-and-generative-ai/fee.html" },
  { label: "TalentSprint: the same programme's course page (eligibility)", url: "https://talentsprint.com/course/agentic-and-generative-ai-iisc/" },
  { label: "IIT Delhi CEP: Certificate Programme in Generative AI, Batch 03 brochure (PDF)", url: "https://home.iitd.ac.in/public/storage/uploads/IITD-CPinGenAI-03%20Brochure_1774611935.pdf" },
];

const COLS = ["Tensorpath", "IIT Bombay Certificate in Generative AI (via Great Learning)", "CCE-IISc Agentic and Generative AI (via TalentSprint)", "IIT Delhi CEP Certificate Programme in Generative AI"];

const ROWS: [string, string, string, string, string][] = [
  ["Length", `${TOTAL_DAYS} days, one live lesson of about 60 minutes a day`, "5 months, online", "6 months, 105 hours of learning", "6 months"],
  ["Format", "Live classes with a trainer in the Tensorpath portal, recorded; an AI learning companion (Genie) between classes", "Weekly live online sessions by IIT Bombay faculty; optional one-day campus immersion", "Faculty-led live online sessions on TalentSprint's iPearl.ai, recorded; a campus visit at IISc", "Live online lectures; a campus immersion (travel and stay at the learner's cost)"],
  ["Who teaches", "A Tensorpath trainer", "IIT Bombay faculty", "IISc faculty members", "An IIT Delhi programme coordinator; the brochure lists faculty from IIT Patna, DA-IICT and IIIT Hyderabad"],
  ["Who can join", "Anyone 16 or older; no heavy math", "A bachelor's degree with at least 50%, or 5+ years of work experience (as the page states it)", "B.E/B.Tech/M.E/M.Tech/M.Sc/MBA with 50%+ and 1 year of work experience, or BSc/BA/LLB/CA/BBA with 65%+ and 2 years", "CS, ECE, EE or IT graduates, or other graduates with 2+ years of coding experience"],
  ["Certificate", "Tensorpath's own certificate after the 20 days and a trainer-approved capstone; anyone can check it at tensorpath.in/verify", "Certificate of Completion from IIT Bombay", "Certificate from CCE-IISc; examinations and evaluations by CCE-IISc", "E-certificate from CEP, IIT Delhi: Successful Completion with 60%+ marks and 80%+ attendance, otherwise Participation"],
  ["Fee", "See the FAQ", "₹1,80,000 + GST", "₹3,20,000 (₹2,40,000 with waiver) + 18% GST, plus a ₹2,000 application fee; non-refundable", "₹1,95,000 + 18% GST (₹2,30,100 in total), plus a ₹1,000 application fee"],
  ["Admission", "Register, we approve the account and email batch dates", "Application, then selection and an offer letter", "Application, then selection", "Application, then an offer; fee paid in instalments to the IIT Delhi CEP account"],
  ["Career help", "Interview prep, résumé help and placement support at the Surge office in Bengaluru after certification", "Not stated on the programme page", "TalentSprint Career Accelerator Program", "Not stated in the brochure"],
];

const FAQS = [
  {
    q: "Is a Tensorpath certificate the same as an IIT or IISc certificate?",
    a: "No. Tensorpath's certificate is issued by Tensorpath (Surge Software Solutions Pvt. Ltd.), not by a university or institute. If you need a certificate from IIT Bombay, IISc or IIT Delhi, choose one of their programmes.",
  },
  {
    q: "Which is quicker to finish?",
    a: `Tensorpath runs for ${TOTAL_DAYS} days. The IIT Bombay certificate (via Great Learning) runs for 5 months; the CCE-IISc programme (via TalentSprint) and IIT Delhi CEP's certificate run for 6 months each.`,
  },
  {
    q: "Do I need a degree or coding experience?",
    a: "Not for Tensorpath: you must be at least 16. IIT Delhi CEP asks for a graduate degree in CS, ECE, EE or IT, or other graduates with 2+ years of coding experience. The IIT Bombay certificate asks for a bachelor's degree with at least 50% or 5+ years of work experience, and the CCE-IISc programme for a degree with set marks plus 1 to 2 years of work experience.",
  },
];

export const metadata: Metadata = {
  title: "Tensorpath vs Great Learning, TalentSprint and IIT AI certificates",
  description:
    "Tensorpath's 20-day live AI course next to the IIT Bombay (Great Learning), CCE-IISc (TalentSprint) and IIT Delhi CEP generative AI certificates: length, format, certificate, eligibility and fees.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Tensorpath vs Great Learning, TalentSprint and IIT certificates",
    description: "Length, format, certificate, eligibility and fees, checked on each programme's own page.",
    url: "https://tensorpath.in/compare",
  },
};

export default function ComparePage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd) }} />
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to Tensorpath</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Tensorpath compared with Great Learning, TalentSprint and IIT certificates</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-700">
        These are different kinds of programme. The IIT Bombay, CCE-IISc and IIT Delhi certificates are 5 to 6 month programmes
        taught by institute faculty, with an institute certificate, selection and a fee in lakhs. Tensorpath is a {TOTAL_DAYS}-day live
        course from the Transformer paper to AI agents, taught by a Tensorpath trainer, with Tensorpath&rsquo;s own verifiable
        certificate. Pick an institute programme if the institute&rsquo;s name on the certificate matters to you; pick Tensorpath if
        you want a short, live start on modern AI without a degree requirement.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Information on the other programmes checked on {CHECKED} on each programme&rsquo;s own page (sources below). Fees and
        batches change; check their pages before you apply. We are not affiliated with Great Learning, TalentSprint, IIT Bombay, IISc or IIT Delhi.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3"></th>
              {COLS.map((c) => <th key={c} scope="col" className="px-4 py-3 font-semibold">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r[0]} className="border-t border-slate-200 align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-slate-900">{r[0]}</th>
                {r.slice(1).map((c, i) => (
                  <td key={i} className={`px-4 py-3 ${i === 0 ? "text-slate-900" : "text-slate-600"}`}>
                    {c === "See the FAQ" ? <Link href="/faq" className="text-brand-600 hover:underline">See the FAQ</Link> : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">Where the institute programmes are better</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>The certificate carries the name of IIT Bombay, IISc or IIT Delhi.</li>
            <li>University faculty teach the classes, and each includes time on campus.</li>
            <li>They run longer: 5 to 6 months (the IISc programme lists 105 hours of learning).</li>
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">Where Tensorpath fits</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>{TOTAL_DAYS} days instead of months, one live topic a day, every session recorded.</li>
            <li>No degree or coding requirement; open to anyone 16 or older.</li>
            <li>An AI learning companion between classes, a capstone project, a certificate anyone can verify, and placement support in Bengaluru.</li>
          </ul>
        </section>
      </div>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Questions</h2>
      <div className="mt-4 space-y-5 text-slate-700">
        {FAQS.map((f) => (
          <section key={f.q}>
            <h3 className="font-bold text-slate-900">{f.q}</h3>
            <p className="mt-1 leading-relaxed">{f.a}</p>
          </section>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Sources (checked {CHECKED})</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{s.label}</a></li>)}
      </ul>

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/syllabus" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">See the 20-day syllabus</Link>
        <Link href="/faq" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">FAQ</Link>
        <Link href="/enquiry" className="px-1 py-2.5 font-semibold text-brand-600 hover:underline">Talk to us</Link>
      </div>
    </main>
  );
}
