import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionLearnerId } from "@/lib/auth";
import JoinForm from "./JoinForm";

export const dynamic = "force-dynamic";

export default function JoinPage() {
  if (getSessionLearnerId()) redirect("/learn");
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-lg animate-fadein rounded-2xl border border-white/10 bg-panel/80 p-8 shadow-2xl">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">← Home</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-2xl">🎓</div>
          <div>
            <div className="font-bold text-white">Start your AI journey</div>
            <div className="text-xs text-gray-400">Get a personal AI coach · first 3 sessions free</div>
          </div>
        </div>
        <JoinForm />
        <p className="mt-5 text-center text-sm text-gray-400">
          Already have an account? <Link href="/signin" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
