import Link from "next/link";

const TABS = [
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard" },
  { key: "leads", href: "/admin", label: "Leads" },
  { key: "cohorts", href: "/admin/cohorts", label: "Cohorts" },
  { key: "careers", href: "/admin/careers", label: "Careers CMS" },
  { key: "placements", href: "/admin/placements", label: "Placements" },
  { key: "media", href: "/admin/media", label: "Media" },
] as const;

export default function AdminNav({ active }: { active: "dashboard" | "leads" | "cohorts" | "careers" | "placements" | "media" }) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">⚙️</div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600">Tensorpath · Admin</div>
            <div className="text-lg font-bold text-slate-900">Surge staff console</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/trainer" className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50">Trainer console</Link>
          <Link href="/" className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50">Public ↗</Link>
        </nav>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${active === t.key ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
