import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { adminPlacementData, listPlacements, placementStats } from "@/lib/careers";
import AdminNav from "../AdminNav";
import AdminPlacements from "./AdminPlacements";

export const dynamic = "force-dynamic";

export default async function AdminPlacementsPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const [learners, placements, stats] = await Promise.all([adminPlacementData(), listPlacements(), placementStats()]);
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="placements" />
      <AdminPlacements learners={learners} placements={placements} stats={stats} />
    </main>
  );
}
