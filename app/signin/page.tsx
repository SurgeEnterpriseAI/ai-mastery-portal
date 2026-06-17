import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionLearnerId } from "@/lib/auth";
import SigninForm from "./SigninForm";

export const dynamic = "force-dynamic";

export default function SigninPage() {
  if (getSessionLearnerId()) redirect("/learn");
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md animate-fadein rounded-2xl border border-white/10 bg-panel/80 p-8 shadow-2xl">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">← Home</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-2xl">🎓</div>
          <div>
            <div className="font-bold text-white">Welcome back</div>
            <div className="text-xs text-gray-400">Sign in to your AI journey</div>
          </div>
        </div>
        <SigninForm />
        <p className="mt-5 text-center text-sm text-gray-400">
          New here? <Link href="/join" className="text-accent hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
