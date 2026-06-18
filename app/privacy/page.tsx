import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Tensorpath" };
export const dynamic = "force-static";

const UPDATED = "18 June 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to Tensorpath</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="prose-slide mt-8 space-y-6 text-slate-700">
        <Section title="1. Who we are">
          Tensorpath is an AI-training program operated by <strong>Surge Software Solutions Pvt. Ltd.</strong> (&ldquo;Tensorpath&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
          This policy explains what personal data we collect, why, and your rights over it. Questions:{" "}
          <a href="mailto:corp@surgesoftware.co.in" className="text-brand-600 hover:underline">corp@surgesoftware.co.in</a>.
        </Section>

        <Section title="2. Data we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Enquiry &amp; enrolment:</strong> name, email, phone, background/experience, goals, and how you heard about us.</li>
            <li><strong>Learning activity:</strong> lesson progress, coaching conversations with the AI coach, capstone submissions, attendance.</li>
            <li><strong>Credentials &amp; placement:</strong> certificate details and, if applicable, placement profile and outcome.</li>
            <li><strong>Technical:</strong> a signed session cookie to keep you logged in, and basic request metadata for security and rate-limiting.</li>
          </ul>
        </Section>

        <Section title="3. Why we use it (purpose &amp; basis)">
          We process your data on the basis of your <strong>consent</strong> and to deliver the service you requested: to contact you about
          the program, run your training, personalise your AI coach, issue verifiable certificates, and support placement.
          We do not sell your personal data.
        </Section>

        <Section title="4. Service providers">
          We share the minimum necessary data with trusted processors who help us run the platform:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Hosting &amp; database</strong> — Vercel and Neon (Postgres).</li>
            <li><strong>AI coaching</strong> — Anthropic (Claude) and Voyage AI (embeddings) to power your coach; conversations are sent to generate responses.</li>
            <li><strong>Email</strong> — our email provider, to send invites, reminders and receipts.</li>
            <li><strong>Payments</strong> — Razorpay processes any paid upgrades; we do not store card details.</li>
          </ul>
        </Section>

        <Section title="5. Retention">
          We keep your data for as long as your account is active and as needed to provide the service and meet legal obligations.
          You can ask us to delete your account and associated personal data at any time.
        </Section>

        <Section title="6. Your rights">
          You may request access to, correction of, or deletion of your personal data, and you may withdraw consent at any time.
          To exercise these rights, email <a href="mailto:corp@surgesoftware.co.in" className="text-brand-600 hover:underline">corp@surgesoftware.co.in</a>.
          Verifiable certificates are public by design; you can ask us to revoke a credential.
        </Section>

        <Section title="7. Cookies">
          We use a single, essential, HTTP-only session cookie to keep you signed in. We do not use third-party advertising or tracking cookies.
        </Section>

        <Section title="8. Security">
          Passwords are hashed, sessions are signed, and data is transmitted over HTTPS. No method of transmission or storage is perfectly secure,
          but we take reasonable measures to protect your information.
        </Section>

        <Section title="9. Children">
          The program is intended for users aged 16 and above. We do not knowingly collect data from children under 16.
        </Section>

        <Section title="10. Changes">
          We may update this policy; material changes will be reflected by the &ldquo;last updated&rdquo; date above.
        </Section>
      </div>

      <p className="mt-10 text-sm text-slate-400">
        See also our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>.
      </p>
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
