import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma, getTrainer } from "@/lib/data";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// TEMPORARY token-guarded trainer-login recovery. Read once, then removed.
const TOKEN = "tp-recover-9c41ad7e";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const trainer = await getTrainer();
  if (url.searchParams.get("reset") === "1") {
    const newPassword = "Tp-" + crypto.randomBytes(9).toString("base64url");
    await prisma.trainer.update({ where: { id: trainer.id }, data: { passwordHash: hashPassword(newPassword) } });
    return NextResponse.json({ email: trainer.email, newPassword, note: "Log in with these, then change the password." });
  }
  return NextResponse.json({ email: trainer.email });
}
