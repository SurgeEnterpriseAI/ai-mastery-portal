import { redirect } from "next/navigation";
import { getSessionTrainerId } from "@/lib/auth";
import { listCapstonesForReview } from "@/lib/capstone";
import AdminNav from "../AdminNav";
import AdminCapstones from "./AdminCapstones";

export const dynamic = "force-dynamic";

export default async function AdminCapstonesPage() {
  if (!getSessionTrainerId()) redirect("/login");
  const capstones = await listCapstonesForReview();
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AdminNav active="capstones" />
      <AdminCapstones capstones={capstones} />
    </main>
  );
}
