import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tensorpath — Learn AI, from first principles to agents · by Surge",
  description:
    "Surge Software's Tensorpath program trains professionals and students on AI through a guided 20-day journey — from the 2017 paper 'Attention Is All You Need' to today's reasoning models and agents — led live by a Surge trainer with a personal AI coach, ending in a verifiable certificate.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
