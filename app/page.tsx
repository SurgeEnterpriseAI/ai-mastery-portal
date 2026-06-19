import Link from "next/link";
import { getAllDayMeta, availableDayCount, TOTAL_DAYS } from "@/lib/curriculum";
import Tour from "@/components/Tour";

export const dynamic = "force-dynamic";

const HOME_STEPS = [
  { title: "Welcome to Tensorpath 👋", body: "Here's how we get you trained — and placed — in AI, end to end. Takes 20 seconds." },
  { target: '[data-tour="enroll-cta"]', title: "1. Register — free", body: "Create your account here. We approve you and email your batch dates — you confirm your seat in one click." },
  { target: '[data-tour="how"]', title: "2. Learn live, inside the portal", body: "Join video classes right here — your trainer screen-shares and teaches live, with chat and who's online. Every session is recorded to revisit." },
  { target: '[data-tour="arc"]', title: "3. 20 guided days + Genie, your companion", body: "A complete, story-driven curriculum, with Genie — your personal AI learning companion — answering your questions between classes." },
  { title: "4. Get certified & placed", body: "Finish your capstone for a verifiable certificate — then your dashboard surfaces live AI openings and interview prep. Ready? Register above." },
];

const COURSE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Tensorpath — 20-Day AI Training",
  description:
    "A 20-day, instructor-led AI program from the 2017 Transformer paper to today's reasoning models and AI agents, with Genie — your personal AI learning companion — a capstone project, a verifiable certificate, and placement support.",
  url: "https://tensorpath.in",
  provider: { "@type": "EducationalOrganization", name: "Tensorpath", url: "https://tensorpath.in" },
  educationalLevel: "Beginner to Advanced",
  teaches: ["Transformers", "Large language models", "Prompt engineering", "RAG", "Fine-tuning & LoRA", "AI agents & tool use", "Multimodal AI", "Shipping AI"],
  hasCourseInstance: [{
    "@type": "CourseInstance",
    courseMode: "Blended",
    courseWorkload: "P20D",
    instructor: { "@type": "Person", name: "Tensorpath expert trainer" },
  }],
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock", category: "Free to begin" },
};

export default function Home() {
  const days = getAllDayMeta();
  const ready = availableDayCount();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(COURSE_JSONLD) }} />
      <div className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        <span>📅 Our first batch starts <strong>Monday, 22 June 2026</strong> — seats are limited.</span>
        <Link href="/join" className="underline hover:text-brand-800">Register now →</Link>
      </div>
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🧠</div>
          <div>
            <div className="text-sm uppercase tracking-widest text-brand-600">Learn AI, end to end</div>
            <div className="text-lg font-bold text-slate-900">Tensorpath</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signin" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link
            href="/join"
            data-tour="enroll-cta"
            className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
          >
            Enroll free →
          </Link>
        </div>
      </header>

      <section className="mt-16 animate-fadein">
        <p className="font-semibold text-brand-600">Tensorpath · upskilling people on AI · 20 days · fundamentals → the 2026 frontier</p>
        <h1 className="mt-3 max-w-4xl text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900">
          From <span className="text-brand-600">&ldquo;Attention Is All You Need&rdquo;</span> to the age of AI agents.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-600">
          Tensorpath is the flagship program for training professionals and students on AI — at scale. A guided
          20-day journey from the very first Transformer to today&rsquo;s reasoning models, multimodal systems, and
          agents. You learn <strong>live with an expert trainer</strong> — video classes, screen-share and recordings,
          right in the portal — plus <strong>Genie, your personal AI companion</strong>, that hand-holds you the whole way. Finish to
          earn a <strong>verifiable certificate and placement support</strong>.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/join" className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700">
            Enroll free — start learning →
          </Link>
          <span className="text-sm text-slate-500">No cost to begin · learn at your pace</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Stat label="Days" value={`${TOTAL_DAYS}`} />
          <Stat label="Lessons ready" value={`${ready}/${TOTAL_DAYS}`} />
          <Stat label="Format" value="Live + AI-coached" />
          <Stat label="Delivered by" value="Experts" />
        </div>
      </section>

      <section className="mt-14">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-card">
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
            poster="/tensorpath-intro-poster.png"
          >
            <source src="/tensorpath-intro.mp4" type="video/mp4" />
            Your browser doesn&rsquo;t support video. <a href="/tensorpath-intro.mp4" className="underline">Download the intro</a>.
          </video>
        </div>
        <p className="mt-2 text-center text-sm text-slate-500">▶ 90-second tour — how Tensorpath takes you from sign-up to trained, certified &amp; placed.</p>
      </section>

      <section className="mt-16" data-tour="how">
        <h2 className="text-2xl font-bold text-slate-900">How Tensorpath gets you trained &amp; placed</h2>
        <p className="mt-1 text-slate-500">One platform, end to end — from sign-up to a job-ready profile.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Step n="1" title="Register — free" body="Create your account and tell us your goal. Two minutes, no cost." />
          <Step n="2" title="Get approved & your batch" body="We approve you and email your batch dates. Confirm your seat in one click — your trainer sees who's in." />
          <Step n="3" title="Learn live, in the portal" body="Join video classes right here: your trainer screen-shares and teaches live, with chat and who's online. Every session is recorded." />
          <Step n="4" title="Genie, your companion, 24/7" body="Between classes, Genie — your personal AI companion — answers questions, gives practice, and tells you exactly what to learn next." />
          <Step n="5" title="Recap & what's next" body="After each class your dashboard shows what was covered, what's coming next, and the recording to revisit anytime." />
          <Step n="6" title="Get certified & placed" body="Finish your capstone for a verifiable certificate — then your dashboard surfaces live AI openings, interview prep, and placement support." />
        </div>
      </section>

      <section className="mt-16" data-tour="arc">
        <h2 className="text-2xl font-bold text-slate-900">The 20-day journey</h2>
        <p className="mt-1 text-slate-500">Every day is a complete, story-driven lesson your trainer delivers live — and you can revisit any time.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <div
              key={d.day}
              className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 transition hover:border-brand-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Day {d.day}</span>
                {d.slideCount > 0 ? (
                  <span className="text-xs text-slate-400">{d.slideCount} slides</span>
                ) : (
                  <span className="text-xs text-amber-600">loading…</span>
                )}
              </div>
              <h3 className="mt-2 font-bold text-slate-900">{d.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{d.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Start your AI journey with Tensorpath</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">Join the professionals and students upskilling on AI through Tensorpath.</p>
        <Link href="/join" className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Enroll free →
        </Link>
      </section>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-400">
        <span>Tensorpath — upskilling professionals &amp; students on AI, end to end.</span>
        <span className="flex flex-wrap gap-4">
          <Link href="/careers" className="text-brand-600 hover:underline">Careers & salaries</Link>
          <Link href="/ai-track" className="text-brand-600 hover:underline">On a Surge track? Add AI</Link>
          <Link href="/enquiry" className="text-brand-600 hover:underline">Talk to us</Link>
          <Link href="/verify" className="text-brand-600 hover:underline">Verify a credential</Link>
          <Link href="/privacy" className="text-slate-400 hover:text-slate-700">Privacy</Link>
          <Link href="/terms" className="text-slate-400 hover:text-slate-700">Terms</Link>
          <Link href="/login" className="text-slate-400 hover:text-slate-700">Trainer sign-in</Link>
        </span>
      </footer>

      <Tour steps={HOME_STEPS} storageKey="home2" label="How it works" />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card px-5 py-3">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-6">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{n}</div>
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
