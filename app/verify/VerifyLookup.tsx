"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyLookup() {
  const router = useRouter();
  const [id, setId] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = id.trim();
        if (v) router.push(`/verify/${encodeURIComponent(v)}`);
      }}
      className="mt-5"
    >
      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="AIM-XXXX-XXXX-XXXX-XXXX"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500"
      />
      <button type="submit" className="mt-3 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700">
        Verify
      </button>
    </form>
  );
}
