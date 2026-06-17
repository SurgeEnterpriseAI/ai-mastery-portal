import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { mutateDB, readDB, newId } from "@/lib/db";
import { getDay } from "@/lib/curriculum";

export async function GET() {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ sessions: (await readDB()).sessions });
}

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { day, date, time } = await req.json().catch(() => ({}));
  const dayNum = Number(day);
  if (!dayNum || !date || !time) {
    return NextResponse.json({ error: "day, date and time required" }, { status: 400 });
  }
  const content = getDay(dayNum);
  const db = await mutateDB((d) => {
    d.sessions.push({
      id: newId("sess"),
      day: dayNum,
      date,
      time,
      title: content?.title || `Day ${dayNum}`,
      status: "scheduled",
      invitesSent: false,
      createdAt: new Date().toISOString(),
    });
    d.sessions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  });
  return NextResponse.json({ sessions: db.sessions });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const db = await mutateDB((d) => {
    d.sessions = d.sessions.filter((s) => s.id !== id);
  });
  return NextResponse.json({ sessions: db.sessions });
}
