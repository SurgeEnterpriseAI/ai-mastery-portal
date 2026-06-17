import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { mutateDB, readDB, newId } from "@/lib/db";

export async function GET() {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ trainees: (await readDB()).trainees });
}

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Accept a comma/newline separated bulk paste too
  const emails = String(email)
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  const db = await mutateDB((d) => {
    for (const e of emails) {
      if (d.trainees.some((t) => t.email.toLowerCase() === e.toLowerCase())) continue;
      d.trainees.push({
        id: newId("tr"),
        name: emails.length === 1 && name ? name : e.split("@")[0],
        email: e,
        addedAt: new Date().toISOString(),
      });
    }
  });
  return NextResponse.json({ trainees: db.trainees });
}

export async function DELETE(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const db = await mutateDB((d) => {
    d.trainees = d.trainees.filter((t) => t.id !== id);
  });
  return NextResponse.json({ trainees: db.trainees });
}
