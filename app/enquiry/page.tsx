import Link from "next/link";
import type { Metadata } from "next";
import EnquiryForm from "@/components/EnquiryForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Talk to us about AI training",
  description: "Leave your details and the Tensorpath team will help you find the right starting point for AI training. Free to begin — learn live with an expert trainer and a personal AI coach.",
  alternates: { canonical: "/enquiry" },
};

export default function EnquiryPage({ searchParams }: { searchParams: { src?: string } }) {
  const src = searchParams?.src || "";
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🧠</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath</div>
            <div className="text-lg font-bold text-slate-900">Talk to us about AI training</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Leave your details and our team will help you find the right starting point. Free to begin · learn live with an expert trainer + a personal AI coach.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <EnquiryForm source={src} />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Ready to start? <Link href="/join" className="text-brand-600 hover:underline">Enroll free</Link>.
        </p>
      </div>
    </main>
  );
}
