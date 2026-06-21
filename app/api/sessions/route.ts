import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { listSessions, createScheduledSession, deleteSession } from "@/lib/data";
import { getDay } from "@/lib/curriculum";

export async function GET() {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ sessions: await listSessions() });
}

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { day, date, time } = await req.json().catch(() => ({}));
  const dayNum = Number(day);
  if (!dayNum || !date || !time) return NextResponse.json({ error: "day, date and time required" }, { status: 400 });
  const title = getDay(dayNum)?.title || `Day ${dayNum}`;
  return NextResponse.json({ sessions: await createScheduledSession(dayNum, date, time, title) });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  return NextResponse.json({ sessions: await deleteSession(id) });
}
