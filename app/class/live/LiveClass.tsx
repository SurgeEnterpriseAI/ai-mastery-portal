"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => { dispose: () => void; addEventListener: (e: string, cb: () => void) => void } }
}

type Jaas = { appId: string; token: string } | null;

/**
 * In-portal live class.
 * - With Jitsi-as-a-Service configured (jaas), embeds 8x8.vc with a JWT — no time
 *   limit, cloud recording, moderator = trainer.
 * - Without it, opens the real meet.jit.si room in a new tab (embedding the free
 *   meet.jit.si is demo-only and disconnects after 5 minutes, so we don't embed it).
 */
export default function LiveClass({ room, displayName, isHost, jaas }: { room: string; displayName: string; isHost: boolean; jaas?: Jaas }) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(false);
  const [error, setError] = useState(false);
  const embed = Boolean(jaas?.token);

  useEffect(() => {
    if (!embed || !jaas) return;
    let api: { dispose: () => void; addEventListener: (e: string, cb: () => void) => void } | null = null;
    let cancelled = false;

    const init = () => {
      if (cancelled || !window.JitsiMeetExternalAPI || !ref.current) return;
      ref.current.innerHTML = "";
      api = new window.JitsiMeetExternalAPI("8x8.vc", {
        roomName: `${jaas.appId}/${room}`,
        jwt: jaas.token,
        parentNode: ref.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: true,
          startWithAudioMuted: !isHost,
          startWithVideoMuted: !isHost,
          subject: "Tensorpath — Live Class",
        },
        interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
      });
      api.addEventListener("readyToClose", () => setLeft(true));
    };

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = `https://8x8.vc/${jaas.appId}/external_api.js`;
      s.async = true;
      s.onload = init;
      s.onerror = () => { if (!cancelled) setError(true); };
      document.body.appendChild(s);
    }
    return () => { cancelled = true; try { api?.dispose(); } catch { /* noop */ } };
  }, [room, displayName, isHost, embed, jaas]);

  // Fallback (no JaaS): open the real meet.jit.si room in a new tab — full video,
  // screen-share, chat and recording, with NO 5-minute limit.
  if (!embed) {
    const url = `https://meet.jit.si/${encodeURIComponent(room)}#userInfo.displayName=%22${encodeURIComponent(displayName)}%22`;
    return (
      <div className="grid h-[70vh] place-items-center rounded-2xl border border-slate-200 bg-white text-center">
        <div className="max-w-md px-6">
          <div className="text-4xl">🎥</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Open the live classroom</h2>
          <p className="mt-1 text-sm text-slate-500">Opens your secure class room in a new tab — full video, screen-share, chat and recording, with no time limit.</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700">🔴 Open live room</a>
          <p className="mt-3 text-xs text-slate-400">In the meeting toolbar, use <strong>Start recording</strong> to capture the session.</p>
        </div>
      </div>
    );
  }

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
