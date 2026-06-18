import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentLearner } from "@/lib/learner";
import { getCoachSession } from "@/lib/data";
import CoachChat from "./CoachChat";

export const dynamic = "force-dynamic";

export default async function CoachPage({ searchParams }: { searchParams: { s?: string } }) {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/signin");
  const sessionId = searchParams.s;
  const session = sessionId ? await getCoachSession(sessionId, learner.id) : null;
  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session not found</h1>
          <Link href="/learn" className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white">← Back to dashboard</Link>
        </div>
      </main>
    );
  }
  return (
    <CoachChat
      sessionId={session.id}
      title={session.title}
      learnerName={learner.name}
      initialMessages={session.messages.map((m) => ({ role: m.role, content: m.content }))}
    />
  );
}
