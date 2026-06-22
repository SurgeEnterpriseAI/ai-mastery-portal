import { NextResponse } from "next/server";
import { isJaasConfigured, generateJaasJwt } from "@/lib/jaas";

export const dynamic = "force-dynamic";

// TEMPORARY token-guarded JaaS config diagnostic. Never returns key material. Removed after use.
const TOKEN = "tp-jaas-7c2a";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const pk = process.env.JAAS_PRIVATE_KEY || "";
  const keyType =
    pk.includes("BEGIN RSA PRIVATE KEY") ? "RSA PRIVATE (PKCS#1) ✓" :
    pk.includes("BEGIN PRIVATE KEY") ? "PRIVATE (PKCS#8) ✓" :
    pk.includes("BEGIN PUBLIC KEY") ? "PUBLIC KEY ✗ (wrong file — need the PRIVATE key)" :
    pk ? "no PEM header ✗ (mangled/partial)" : "empty";
  let tokenOk = false;
  try { tokenOk = Boolean(generateJaasJwt({ room: "diag", name: "diag", moderator: true })); } catch { /* logged in lib */ }
  return NextResponse.json({
    jaasConfigured: isJaasConfigured(),
    hasKid: Boolean(process.env.JAAS_KID),
    kidHasSlash: (process.env.JAAS_KID || "").includes("/"),
    privateKeyType: keyType,
    privateKeyLength: pk.length,
    privateKeyHasEscapedNewlines: pk.includes("\\n"),
    privateKeyHasRealNewlines: pk.includes("\n"),
    jwtGenerates: tokenOk,
  });
}
