import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionLearnerId } from "@/lib/auth";
import SigninForm from "./SigninForm";

export const dynamic = "force-dynamic";

export default function SigninPage() {
  if (getSessionLearnerId()) redirect("/learn");
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md animate-fadein rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Home</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🎓</div>
          <div>
            <div className="font-bold text-slate-900">Welcome back</div>
            <div className="text-xs text-slate-500">Sign in to your AI journey</div>
          </div>
        </div>
        <SigninForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          New here? <Link href="/join" className="text-brand-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
