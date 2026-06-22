import Link from "next/link";
import type { Metadata } from "next";
import ForgotForm from "./ForgotForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forgot password", alternates: { canonical: "/forgot" } };

export default function ForgotPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md animate-fadein rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/signin" className="text-sm text-slate-500 hover:text-slate-900">← Back to sign in</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🔑</div>
          <div>
            <div className="font-bold text-slate-900">Reset your password</div>
            <div className="text-xs text-slate-500">We&rsquo;ll email you a secure reset link</div>
          </div>
        </div>
        <ForgotForm />
      </div>
    </main>
  );
}
