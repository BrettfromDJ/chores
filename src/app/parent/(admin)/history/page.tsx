import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { Mascot } from "@/components/Mascot";

const STATUS = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-indigo-50 text-slate-600",
} as const;

export default async function HistoryAdmin({ searchParams }: { searchParams: Promise<{ kid?: string; status?: string }> }) {
  const familyId = await requireParent();
  const { kid, status } = await searchParams;
  const { completions, children, timezone } = await loadFamily(familyId);
  const kids = new Map(children.map((c) => [c.id, c]));
  const rows = completions
    .filter((c) => (!kid || c.childId === kid) && (!status || c.status === status))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 200);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone });
  const href = (k?: string, s?: string) => {
    const p = new URLSearchParams();
    if (k) p.set("kid", k);
    if (s) p.set("status", s);
    const q = p.toString();
    return `/parent/history${q ? `?${q}` : ""}`;
  };
  const chip = (active: boolean) => `rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-royal text-white" : "bg-white text-slate-600 ring-1 ring-indigo-100 hover:bg-slate-50"}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">History</h1>
        <p className="text-sm text-slate-500">Every turn-in, with who reviewed it and the XP it earned.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={href(undefined, status)} className={chip(!kid)}>
          Everyone
        </Link>
        {children.map((c) => (
          <Link key={c.id} href={href(c.id, status)} className={chip(kid === c.id)}>
            {c.name}
          </Link>
        ))}
        <span className="mx-1 w-px bg-slate-200" />
        {(["approved", "pending", "rejected"] as const).map((s) => (
          <Link key={s} href={href(kid, status === s ? undefined : s)} className={`${chip(status === s)} capitalize`}>
            {s}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-indigo-50">
            {rows.map((c) => {
              const child = kids.get(c.childId);
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl">{c.choreIcon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.choreTitle}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      {child && <Mascot creature={child.creature} size={14} />}
                      {child?.name ?? "Removed"} · {fmt.format(new Date(c.submittedAt))}
                      {c.note && <span className="truncate"> · “{c.note}”</span>}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS[c.status]}`}>{c.status}</span>
                  <span className={`w-20 shrink-0 text-right text-sm font-semibold ${c.status === "approved" ? "text-emerald-600" : "text-slate-300"}`}>+{c.amountCents} XP</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
