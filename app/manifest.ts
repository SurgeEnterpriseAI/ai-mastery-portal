import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest) so learners can install Tensorpath on a phone's home screen.
// No service worker: installing only adds the icon and opens the site standalone. /learn sends signed-out
// visitors to /signin, which comes back to /learn after sign-in. Colours are brand-600 and canvas from tailwind.config.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tensorpath",
    short_name: "Tensorpath",
    description: "A 20-day live AI course, from the Transformer paper to AI agents, with a personal AI coach.",
    id: "/learn",
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#2563eb",
    background_color: "#f4f6fa",
    categories: ["education"],
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
