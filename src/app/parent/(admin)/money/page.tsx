import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { MoneyForm } from "@/components/parent/forms";
import { Mascot } from "@/components/Mascot";
import { money, signedMoney, xp } from "@/lib/money";

const KIND = {
  earned: { label: "Quest", tone: "bg-emerald-100 text-emerald-800" },
  bonus: { label: "Bonus", tone: "bg-sky-100 text-sky-800" },
  payout: { label: "Cash out", tone: "bg-amber-100 text-amber-800" },
  level_up: { label: "Level up", tone: "bg-violet-100 text-violet-800" },
} as const;

export default async function MoneyAdmin() {
  const familyId = await requireParent();
  const { children, stats, transactions, completions, timezone } = await loadFamily(familyId);
  const kids = new Map(children.map((c) => [c.id, c]));
  const titles = new Map(completions.map((c) => [c.id, c.choreTitle]));
  const recent = [...transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || Number(b.kind === "level_up") - Number(a.kind === "level_up"))
    .slice(0, 60);
  const owed = children.reduce((s, c) => s + stats[c.id].balanceCents, 0);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: timezone });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Money</h1>
          <p className="text-sm text-slate-500">Kids earn XP from approved quests (100 XP = $1), plus $1 every time they level up. Cash out when you hand over real money.</p>
        </div>
        <div className="card px-4 py-2 text-right">
          <p className="text-xs text-slate-500">Total in kids&apos; wallets</p>
          <p className="text-lg font-semibold">{money(owed)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {children.map((kid) => {
          const s = stats[kid.id];
          return (
            <section key={kid.id} className="card p-4">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${kid.color}22` }}>
                  <Mascot creature={kid.creature} size={32} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{kid.name}</p>
                  <p className="text-xs text-slate-500">{money(s.lifetimeCents)} earned all-time</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">{money(s.balanceCents)}</p>
                  <p className="text-xs text-slate-500">{xp(s.balanceCents)}</p>
                </div>
              </div>
              <MoneyForm kid={kid} balanceCents={s.balanceCents} />
            </section>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent activity</h2>
        <div className="card overflow-hidden">
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No money has moved yet.</p>
          ) : (
            <ul className="divide-y divide-indigo-50">
              {recent.map((t) => {
                const kid = kids.get(t.childId);
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    {kid && <Mascot creature={kid.creature} size={20} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.kind === "earned" ? (titles.get(t.refId ?? "") ?? "Quest") : t.note || KIND[t.kind].label}</p>
                      <p className="text-xs text-slate-500">
                        {kid?.name ?? "Removed"} · {fmt.format(new Date(t.createdAt))}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${KIND[t.kind].tone}`}>{KIND[t.kind].label}</span>
                    <span className={`w-20 shrink-0 text-right text-sm font-semibold ${t.amountCents > 0 ? "text-emerald-600" : "text-slate-700"}`}>{signedMoney(t.amountCents)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
