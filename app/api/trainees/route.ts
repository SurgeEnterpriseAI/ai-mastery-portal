import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { listTrainees, addTrainees, deleteTrainee } from "@/lib/data";

export async function GET() {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ trainees: await listTrainees() });
}

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  return NextResponse.json({ trainees: await addTrainees(String(email), name) });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  return NextResponse.json({ trainees: await deleteTrainee(id) });
}
