import { NextResponse } from "next/server";
import { clearLearnerCookie } from "@/lib/auth";

export async function POST() {
  clearLearnerCookie();
  return NextResponse.json({ ok: true });
}
