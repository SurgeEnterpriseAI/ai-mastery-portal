import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { getCurrentLearner } from "@/lib/learner";
import { getLiveRoomName } from "@/lib/data";
import { isJaasConfigured, jaasAppId, generateJaasJwt } from "@/lib/jaas";
import LiveClass from "./LiveClass";

export const dynamic = "force-dynamic";

export default async function LiveClassPage() {
  const trainerId = getSessionTrainerId();
  const learner = trainerId ? null : await getCurrentLearner();
  if (!trainerId && !learner) redirect("/signin");

  const isHost = Boolean(trainerId);
  const displayName = isHost ? "Tensorpath Trainer" : learner!.name;
  const room = await getLiveRoomName();
  const back = isHost ? "/trainer" : "/learn";
  const jaas = isJaasConfigured()
    ? { appId: jaasAppId(), token: generateJaasJwt({ room, name: displayName, email: learner?.email, moderator: isHost }) || "" }
    : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">🔴</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath · Live class</div>
            <div className="font-bold text-slate-900">{isHost ? "You're hosting — share your screen to teach" : "Live class room"}</div>
          </div>
        </div>
        <Link href={back} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">← Back</Link>
      </header>

      {isHost && (
        <p className="mb-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm text-slate-600">
          Use <strong>Share screen</strong> to present, <strong>Chat</strong> to take questions, the participants panel to see who&rsquo;s online, and <strong>Start recording</strong> to capture the session.
        </p>
      )}

      <LiveClass room={room} displayName={displayName} isHost={isHost} jaas={jaas} />
    </main>
  );
}
