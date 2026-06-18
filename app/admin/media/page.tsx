import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { listMedia } from "@/lib/media";
import { listJobRoles } from "@/lib/careers";
import AdminNav from "../AdminNav";
import AdminMedia from "./AdminMedia";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const [media, roles] = await Promise.all([listMedia(), listJobRoles()]);
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="media" />
      <AdminMedia media={media} roles={roles} />
    </main>
  );
}
