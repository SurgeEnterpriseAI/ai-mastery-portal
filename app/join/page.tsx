import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionLearnerId } from "@/lib/auth";
import JoinForm from "./JoinForm";

export const dynamic = "force-dynamic";

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
            <div className="text-xs text-slate-500">Live training + a personal AI coach · first 3 coaching sessions free</div>
          </div>
        </div>
        <JoinForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link href="/signin" className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
