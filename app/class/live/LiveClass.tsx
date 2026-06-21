"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => { dispose: () => void; addEventListener: (e: string, cb: () => void) => void } }
}

/**
 * In-portal live class — embeds Jitsi Meet (video, screen-share, chat,
 * who's-online, raise hand, and recording — all built in). The trainer joins
 * as host; students join the same room. No external account needed.
 */
export default function LiveClass({ room, displayName, isHost }: { room: string; displayName: string; isHost: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let api: { dispose: () => void; addEventListener: (e: string, cb: () => void) => void } | null = null;
    let cancelled = false;

    const init = () => {
      if (cancelled || !window.JitsiMeetExternalAPI || !ref.current) return;
      ref.current.innerHTML = "";
      api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: room,
        parentNode: ref.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: true,
          startWithAudioMuted: !isHost,
          startWithVideoMuted: !isHost,
          disableThirdPartyRequests: true,
          enableWelcomePage: false,
          subject: "Tensorpath — Live Class",
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          DISABLE_DEEP_LINKING: true,
        },
      });
      api.addEventListener("readyToClose", () => setLeft(true));
    };

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://meet.jit.si/external_api.js";
      s.async = true;
      s.onload = init;
      s.onerror = () => { if (!cancelled) setError(true); };
      document.body.appendChild(s);
    }
    return () => { cancelled = true; try { api?.dispose(); } catch { /* noop */ } };
  }, [room, displayName, isHost]);

  if (left) {
    return (
      <div className="grid h-[78vh] place-items-center rounded-2xl border border-slate-200 bg-white text-center">
        <div>
          <div className="text-4xl">👋</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">You&rsquo;ve left the class</h2>
          <p className="mt-1 text-sm text-slate-500">You can rejoin anytime while the session is live.</p>
          <button onClick={() => location.reload()} className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Rejoin</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid h-[78vh] place-items-center rounded-2xl border border-slate-200 bg-white text-center">
        <div className="max-w-sm px-6">
          <div className="text-4xl">📡</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Couldn&rsquo;t connect to the live class</h2>
          <p className="mt-1 text-sm text-slate-500">The video service couldn&rsquo;t load. Check your connection and disable any ad-blocker, then try again.</p>
          <button onClick={() => location.reload()} className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Try again</button>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="h-[78vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900" />;
}
