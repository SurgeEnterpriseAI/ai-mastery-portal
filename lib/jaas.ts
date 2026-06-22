import crypto from "crypto";

// Jitsi-as-a-Service (8x8.vc) JWT minting. Activates when these env vars are set:
//   JAAS_APP_ID       e.g. vpaas-magic-cookie-xxxxxxxx   (from jaas.8x8.vc → API Keys)
//   JAAS_KID          the Key ID shown when you add an API key (looks like <appId>/<keyName>)
//   JAAS_PRIVATE_KEY  the RSA private key PEM for that API key (paste the whole -----BEGIN...----- block)
// Tensorpath's JaaS App ID (a public identifier — it's embedded client-side in every
// meeting URL). Override with the JAAS_APP_ID env var if it ever changes.
const DEFAULT_APP_ID = "vpaas-magic-cookie-1d487efbd528479891699b0e1c9df68e";

export function jaasAppId(): string {
  return process.env.JAAS_APP_ID || DEFAULT_APP_ID;
}
export function isJaasConfigured(): boolean {
  // App ID has a default, so only the Key ID + private key (the signing material) are needed.
  return Boolean(jaasAppId() && process.env.JAAS_KID && process.env.JAAS_PRIVATE_KEY);
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** Mints a short-lived JaaS JWT for one user. Returns null if JaaS isn't configured. */
export function generateJaasJwt(opts: { room: string; name: string; email?: string; moderator: boolean; id?: string }): string | null {
  const appId = process.env.JAAS_APP_ID;
  const kid = process.env.JAAS_KID;
  let key = process.env.JAAS_PRIVATE_KEY;
  if (!appId || !kid || !key) return null;
  key = key.replace(/\\n/g, "\n"); // un-escape newlines if the PEM was stored single-line

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", kid, typ: "JWT" };
  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: appId,
    room: "*",
    iat: now,
    nbf: now - 10,
    exp: now + 3 * 60 * 60, // 3 hours
    context: {
      user: { id: opts.id || crypto.randomUUID(), name: opts.name, email: opts.email || "", moderator: opts.moderator ? "true" : "false" },
      features: { recording: "true", livestreaming: "false", transcription: "true", "outbound-call": "false" },
    },
  };
  try {
    const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
    const sig = crypto.sign("RSA-SHA256", Buffer.from(data), key).toString("base64url");
    return `${data}.${sig}`;
  } catch (e) {
    console.error("[jaas] JWT signing failed (check JAAS_PRIVATE_KEY):", (e as Error).message);
    return null;
  }
}
