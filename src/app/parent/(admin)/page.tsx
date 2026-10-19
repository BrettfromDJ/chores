import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { localDate } from "@/lib/game";
import { Mascot } from "@/components/Mascot";
import { ApprovalQueue, type QueueItem } from "@/components/parent/ApprovalQueue";
import { money, xp } from "@/lib/money";

export default async function ParentHome() {
  const familyId = await requireParent();
  const { children, chores, completions, transactions, stats, timezone } = await loadFamily(familyId);
  const byId = new Map(children.map((c) => [c.id, c]));
  const choreById = new Map(chores.map((c) => [c.id, c]));
  const today = localDate(new Date(), timezone);

  const queue: QueueItem[] = completions
    .filter((c) => c.status === "pending" && byId.has(c.childId))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((c) => {
      const kid = byId.get(c.childId)!;
      return {
        id: c.id,
        childName: kid.name,
        creature: kid.creature,
        color: kid.color,
        icon: c.choreIcon,
        title: c.choreTitle,
        amountCents: c.amountCents,
        submittedAt: c.submittedAt,
        frequency: c.periodKey.includes("W") ? "weekly" : "daily",
      };
    });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold tracking-tight">Approvals</h1>
        <ApprovalQueue items={queue} />
        <p className="mt-2 text-xs text-slate-500">XP is only paid when you approve. 100 XP = $1, and it goes straight into your kid&apos;s wallet.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Kids</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {children.map((kid) => {
            const s = stats[kid.id];
            const assigned = chores.filter((c) => c.active && c.frequency === "daily" && c.childIds.includes(kid.id)).length;
            const doneToday = completions.filter(
              (c) => c.childId === kid.id && c.periodKey === today && c.status !== "rejected" && choreById.get(c.choreId)?.frequency === "daily",
            ).length;
            return (
              <li key={kid.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${kid.color}22` }}>
                    <Mascot creature={kid.creature} size={36} />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{kid.name}</p>
                    <p className="text-xs text-slate-500">
                      Level {s.level} · {money(s.lifetimeCents)} earned all-time · 🔥 {s.streak}-day streak
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label={xp(s.balanceCents)} value={money(s.balanceCents)} />
                  <Metric label="Today" value={`${doneToday}/${assigned}`} />
                  <Metric label="Cashed out" value={money(transactions.filter((t) => t.childId === kid.id && t.kind === "payout").reduce((sum, t) => sum - t.amountCents, 0))} />
                </dl>
                <Link href="/parent/money" className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50/60 px-3 py-2 text-sm font-medium text-royal hover:bg-indigo-50">
                  Cash out or add a bonus <span aria-hidden>→</span>
                </Link>
              </li>
            );
          })}
          {children.length === 0 && (
            <li className="card p-6 text-sm text-slate-500">
              No kids yet. <Link href="/parent/trainers" className="font-medium text-slate-900 underline">Add your first trainer</Link>.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-indigo-50/50 px-2 py-2">
      <dd className="text-sm font-semibold">{value}</dd>
      <dt className="text-[11px] text-slate-500">{label}</dt>
    </div>
  );
}
