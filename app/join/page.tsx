import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionLearnerId } from "@/lib/auth";
import JoinForm from "./JoinForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enroll free — start your 20-day AI journey",
  description: "Create your free Tensorpath account and start learning AI — guided live by an expert trainer and Genie, your personal AI companion. First 3 coaching sessions free.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  if (getSessionLearnerId()) redirect("/learn");
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-lg animate-fadein rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Home</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🎓</div>
          <div>
            <div className="font-bold text-slate-900">Join Tensorpath</div>
            <div className="text-xs text-slate-500">Live training + Genie, your AI companion · first 3 coaching sessions free</div>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <video className="aspect-video w-full" controls playsInline preload="metadata" poster="/tensorpath-intro-poster.png">
            <source src="/tensorpath-intro.mp4" type="video/mp4" />
            Your browser doesn&rsquo;t support video. <a href="/tensorpath-intro.mp4" className="underline">Download the intro</a>.
          </video>
        </div>
        <p className="mt-1.5 text-center text-xs text-slate-400">▶ 90-second tour — see how it works before you enroll.</p>
        <JoinForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link href="/signin" className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
