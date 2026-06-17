import { NextResponse } from "next/server";
import { getSessionTrainerId } from "@/lib/auth";
import { setCertificateStatus } from "@/lib/data";

export async function POST(req: Request) {
  if (!getSessionTrainerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { credentialId, revoke } = await req.json().catch(() => ({}));
  if (!credentialId) return NextResponse.json({ error: "credentialId required" }, { status: 400 });
  const cert = await setCertificateStatus(String(credentialId), revoke === false ? "valid" : "revoked");
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: cert.status, message: `Credential ${cert.status === "revoked" ? "revoked" : "reinstated"}.` });
}
