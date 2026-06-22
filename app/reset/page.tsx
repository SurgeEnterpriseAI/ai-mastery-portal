import Link from "next/link";
import type { Metadata } from "next";
import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set a new password", robots: { index: false }, alternates: { canonical: "/reset" } };

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token || "";
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md animate-fadein rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/signin" className="text-sm text-slate-500 hover:text-slate-900">← Back to sign in</Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🔒</div>
          <div>
            <div className="font-bold text-slate-900">Set a new password</div>
            <div className="text-xs text-slate-500">Choose a strong password you&rsquo;ll remember</div>
          </div>
        </div>
        {token ? <ResetForm token={token} /> : (
          <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            This reset link is missing its token. Please open the link from your email, or <Link href="/forgot" className="font-semibold underline">request a new one</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
