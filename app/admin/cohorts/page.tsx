import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { listCohorts, listLearnersForCohorts, getAttendance } from "@/lib/cohorts";
import { cohortRsvpMatrix } from "@/lib/session-rsvp";
import AdminNav from "../AdminNav";
import AdminCohorts from "./AdminCohorts";

export const dynamic = "force-dynamic";

export default async function AdminCohortsPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const [cohorts, learners] = await Promise.all([listCohorts(), listLearnersForCohorts()]);
  const attEntries = await Promise.all(cohorts.map(async (c) => [c.id, await getAttendance(c.id)] as const));
  const attendance = Object.fromEntries(attEntries);
  const rsvpEntries = await Promise.all(cohorts.map(async (c) => [c.id, await cohortRsvpMatrix(c.id)] as const));
  const rsvps = Object.fromEntries(rsvpEntries);
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="cohorts" />
      <AdminCohorts cohorts={cohorts} learners={learners} attendance={attendance} rsvps={rsvps} />
    </main>
  );
}
