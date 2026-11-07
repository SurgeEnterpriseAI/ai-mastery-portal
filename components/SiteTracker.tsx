"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one pageview per page to /api/events (Surge HQ traffic). Renders nothing, changes no layout.
 * Opening any page with ?internal=1 marks this browser as the founder's own (not counted) for a year.
 */
export default function SiteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const search = window.location.search;
      if (/[?&]internal=1(&|$)/.test(search)) document.cookie = "tp_internal=1; path=/; max-age=31536000; samesite=lax";
      fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: pathname + search, referrer: document.referrer }),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    } catch {
      /* tracking must never break a page */
    }
  }, [pathname]);
  return null;
}
