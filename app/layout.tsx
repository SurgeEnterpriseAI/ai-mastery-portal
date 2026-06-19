import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE = "https://tensorpath.in";
const DESCRIPTION =
  "Tensorpath is a 20-day, instructor-led AI training program — from the 2017 paper 'Attention Is All You Need' to today's reasoning models and AI agents. Learn live with an expert trainer and a personal AI coach, build a capstone, and earn a verifiable certificate with placement support. Free to begin.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Tensorpath — Learn AI in 20 days, from first principles to agents",
    template: "%s · Tensorpath",
  },
  description: DESCRIPTION,
  applicationName: "Tensorpath",
  keywords: [
    "AI training", "learn AI", "AI course India", "machine learning course",
    "LLM course", "generative AI training", "AI bootcamp", "AI certification",
    "AI jobs India", "prompt engineering", "RAG", "AI agents", "Tensorpath",
  ],
  authors: [{ name: "Tensorpath" }],
  creator: "Tensorpath",
  publisher: "Tensorpath",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Tensorpath",
    title: "Tensorpath — Learn AI in 20 days, from first principles to agents",
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tensorpath — Learn AI in 20 days",
    description: "20-day instructor-led AI training + personal AI coach, a verifiable certificate, and placement support. Free to begin.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "education",
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Tensorpath",
  url: SITE,
  description: DESCRIPTION,
  logo: `${SITE}/icon.png`,
  sameAs: [] as string[],
  parentOrganization: { "@type": "Organization", name: "Surge Software Solutions Pvt. Ltd." },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
      </body>
    </html>
  );
}
