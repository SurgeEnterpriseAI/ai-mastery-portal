import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { listJobRoles, listOpenings } from "@/lib/careers";
import AdminNav from "../AdminNav";
import AdminCareers from "./AdminCareers";

export const dynamic = "force-dynamic";

export default async function AdminCareersPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const [roles, openings] = await Promise.all([listJobRoles(), listOpenings()]);
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="careers" />
      <AdminCareers roles={roles} openings={openings} />
    </main>
  );
}
