import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — Tensorpath" };
export const dynamic = "force-static";

const UPDATED = "18 June 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to Tensorpath</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Terms of Service</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="prose-slide mt-8 space-y-6 text-slate-700">
        <Section title="1. Agreement">
          These Terms govern your use of Tensorpath, operated by <strong>Surge Software Solutions Pvt. Ltd.</strong>
          By enrolling or using the platform, you agree to these Terms and our{" "}
          <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
        </Section>

        <Section title="2. The program">
          Tensorpath is a 20-day, instructor-led AI training program with a personal AI coach, a reviewed capstone project,
          and a verifiable certificate. Curriculum, schedule and features may evolve to improve the learning experience.
        </Section>

        <Section title="3. Accounts">
          You are responsible for the accuracy of the information you provide and for keeping your login credentials secure.
          You must be at least 16 years old to enrol.
        </Section>

        <Section title="4. Fees &amp; payments">
          The program is free to begin. Some features (such as unlimited AI coaching) may require a paid upgrade, shown clearly before purchase.
          Payments are processed by Razorpay. Refunds, where applicable, follow the terms communicated at the point of sale.
        </Section>

        <Section title="5. Certificates">
          Certificates are issued only after you complete the 20 days and your capstone is approved by a trainer.
          Certificates are publicly verifiable; we may revoke a credential if it was issued in error or obtained through misrepresentation.
        </Section>

        <Section title="6. Acceptable use">
          You agree not to misuse the platform — including attempting to disrupt the service, scrape data at scale, share access,
          submit others&rsquo; work as your own capstone, or use the AI coach to generate unlawful or harmful content.
        </Section>

        <Section title="7. Intellectual property">
          All course content, materials, and the platform are the property of Surge Software Solutions Pvt. Ltd. and may not be
          copied, redistributed or resold without permission. Work you create in your capstone remains yours.
        </Section>

        <Section title="8. Placement support">
          We provide career resources, openings and placement support, but <strong>we do not guarantee a job, interview, or specific salary.</strong>
          Outcomes depend on your effort, performance and market conditions.
        </Section>

        <Section title="9. AI-generated guidance">
          The AI coach provides educational guidance and may occasionally be inaccurate. It is not professional, legal, or financial advice;
          verify important information independently.
        </Section>

        <Section title="10. Limitation of liability">
          The platform is provided on an &ldquo;as is&rdquo; basis. To the maximum extent permitted by law, Tensorpath is not liable for
          indirect or consequential damages arising from your use of the service.
        </Section>

        <Section title="11. Governing law">
          These Terms are governed by the laws of India, with exclusive jurisdiction in the courts of Hyderabad, Telangana.
        </Section>

        <Section title="12. Contact">
          Questions about these Terms: <a href="mailto:corp@surgesoftware.co.in" className="text-brand-600 hover:underline">corp@surgesoftware.co.in</a>.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-1.5 leading-relaxed">{children}</div>
    </section>
  );
}
