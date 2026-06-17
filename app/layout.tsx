import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Mastery Portal — From Attention to Agents",
  description:
    "A 20-day, story-driven AI training journey from the 2017 paper 'Attention Is All You Need' to the June 2026 frontier. Trainer portal with scheduling, email invites, and an auto-advancing presentation engine.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
