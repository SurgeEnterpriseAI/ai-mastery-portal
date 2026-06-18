import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (getSessionTrainerId()) redirect("/trainer");
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md animate-fadein rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">🧠</div>
          <div>
            <div className="font-bold text-slate-900">Trainer Login</div>
            <div className="text-xs text-slate-500">AI Mastery Portal</div>
          </div>
        </div>
        <LoginForm />
        <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Trainer access only. Use the credentials provided by your administrator. Forgot them? Contact your portal admin.
        </p>
      </div>
    </main>
  );
}
