import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { listLeads, leadStats } from "@/lib/data";
import AdminNav from "./AdminNav";
import AdminLeads from "./AdminLeads";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const [leads, stats] = await Promise.all([listLeads(), leadStats()]);
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="leads" />
      <AdminLeads leads={leads} stats={stats} />
    </main>
  );
}
