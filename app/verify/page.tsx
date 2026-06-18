import VerifyLookup from "./VerifyLookup";

export const dynamic = "force-dynamic";

export default function VerifyIndex() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl mx-auto">🧠</div>
        <div className="mt-3 text-xs uppercase tracking-widest text-brand-600">Surge Software · AI Academy</div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Verify a credential</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the credential ID from an AI Mastery certificate to confirm it&rsquo;s genuine and see the holder&rsquo;s capstone project.
        </p>
        <VerifyLookup />
      </div>
    </main>
  );
}
