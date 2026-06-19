import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/trainer", "/learn", "/signin", "/login"],
      },
    ],
    sitemap: "https://tensorpath.in/sitemap.xml",
    host: "https://tensorpath.in",
  };
}
