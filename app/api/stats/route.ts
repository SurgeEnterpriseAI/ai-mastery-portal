import { NextResponse } from "next/server";
import crypto from "crypto";
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
  // capture the exact OpenSSL error (not secret)
  let signError: string | null = null;
  try { crypto.sign("RSA-SHA256", Buffer.from("test"), pk.replace(/\\n/g, "\n")); }
  catch (e) { signError = (e as Error).message; }
  return NextResponse.json({
    jaasConfigured: isJaasConfigured(),
    hasKid: Boolean(process.env.JAAS_KID),
    kidHasSlash: (process.env.JAAS_KID || "").includes("/"),
    privateKeyType: keyType,
    privateKeyLength: pk.length,
    privateKeyFirstLine: pk.split("\n")[0] || "",
    privateKeyLastLine: (pk.trim().split("\n").pop()) || "",
    privateKeyHasEscapedNewlines: pk.includes("\\n"),
    jwtGenerates: tokenOk,
    signError,
  });
}
