import Link from "next/link";
import type { Metadata } from "next";
import { setRsvp } from "@/lib/session-rsvp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Class RSVP", robots: { index: false } };

export default async function RsvpPage({ searchParams }: { searchParams: { t?: string; a?: string } }) {
  const token = searchParams.t || "";
  const action = searchParams.a === "decline" ? "decline" : "confirm";
  const result = token ? await setRsvp(token, action) : { ok: false };
  const confirmed = result.ok && result.status === "confirmed";

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md animate-fadein rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        {!result.ok ? (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="mt-3 text-xl font-bold text-slate-900">This RSVP link isn&rsquo;t valid</h1>
            <p className="mt-1 text-sm text-slate-500">It may have expired or already been used. Please use the latest class email, or just join from your dashboard when class is live.</p>
          </>
        ) : confirmed ? (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="mt-3 text-xl font-bold text-slate-900">You&rsquo;re confirmed{result.learnerName ? `, ${result.learnerName.split(" ")[0]}` : ""}!</h1>
            <p className="mt-1 text-sm text-slate-600">See you in the <strong>{result.cohortName}</strong> class on <strong>{result.date}</strong>. We&rsquo;ll send the join link when it&rsquo;s time.</p>
          </>
        ) : (
          <>
            <div className="text-4xl">👍</div>
            <h1 className="mt-3 text-xl font-bold text-slate-900">No problem — marked as can&rsquo;t make it</h1>
            <p className="mt-1 text-sm text-slate-600">Thanks for letting us know about the {result.date} class. You can still catch the recording and recap afterwards.</p>
          </>
        )}
        <Link href="/learn" className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Go to my dashboard</Link>
      </div>
    </main>
  );
}
