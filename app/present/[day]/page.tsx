import Link from "next/link";
import { getDay, TOTAL_DAYS } from "@/lib/curriculum";
import { getAppState } from "@/lib/data";
import { getSessionTrainerId } from "@/lib/auth";
import Presenter from "./Presenter";

export const dynamic = "force-dynamic";

export default async function PresentPage({ params }: { params: { day: string } }) {
  const dayNum = Number(params.day);
  const day = getDay(dayNum);
  const isTrainer = Boolean(getSessionTrainerId());
  const { cohortName, progress } = await getAppState();

  if (!day) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <div className="text-5xl">⏳</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Day {dayNum} isn&rsquo;t ready yet</h1>
          <p className="mt-2 text-slate-500">
            This day&rsquo;s material is still being prepared. Please check back shortly.
          </p>
          <Link href={isTrainer ? "/trainer" : "/"} className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white">
            ← Back
          </Link>
        </div>
      </main>
    );
  }

  const resumeAt = dayNum === progress.currentDay ? progress.currentSlide : 0;

  return (
    <Presenter
      day={day}
      isTrainer={isTrainer}
      resumeAt={resumeAt}
      cohortName={cohortName}
      totalDays={TOTAL_DAYS}
      hasNextDay={dayNum < TOTAL_DAYS && Boolean(getDay(dayNum + 1))}
    />
  );
}
