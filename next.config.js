const { execSync } = require("child_process");
const fs = require("fs");

/**
 * Date of the commit being built, for sitemap lastmod (never the request time). From git when the build has a
 * checkout; on the server (git archive, no .git) from REVISION_DATE, written by deploy/server-deploy.sh.
 * Empty when neither exists: the sitemap then leaves lastmod out.
 */
function commitDate() {
  const valid = (s) => (s && !Number.isNaN(Date.parse(s)) ? s : "");
  try {
    const d = valid(execSync("git log -1 --format=%cI", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim());
    if (d) return d;
  } catch {}
  try {
    return valid(fs.readFileSync("REVISION_DATE", "utf8").trim());
  } catch {}
  return "";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { SITE_COMMIT_DATE: commitDate() },
};

module.exports = nextConfig;
