import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { listLeads, leadStats } from "@/lib/data";
import AdminLeads from "./AdminLeads";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const [leads, stats] = await Promise.all([listLeads(), leadStats()]);
  return <AdminLeads leads={leads} stats={stats} />;
}
