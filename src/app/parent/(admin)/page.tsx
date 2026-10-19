import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { activeGoal, localDate } from "@/lib/game";
import { PixelSprite } from "@/components/PixelSprite";
import { ApprovalQueue, type QueueItem } from "@/components/parent/ApprovalQueue";

export default async function ParentHome() {
  const familyId = await requireParent();
  const { children, chores, completions, rewards, stats, timezone } = await loadFamily(familyId);
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
        xp: c.xp,
        submittedAt: c.submittedAt,
        frequency: c.periodKey.includes("W") ? "weekly" : "daily",
      };
    });

  const toDeliver = rewards.filter((r) => r.status === "unlocked");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold tracking-tight">Approvals</h1>
        <ApprovalQueue items={queue} />
        <p className="mt-2 text-xs text-slate-500">XP is only awarded when you approve. Rewards unlock automatically once a goal is reached.</p>
      </section>

      {toDeliver.length > 0 && (
        <section className="card flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
          <span className="text-2xl">🎁</span>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-900">{toDeliver.length} reward{toDeliver.length > 1 ? "s" : ""} to hand over</p>
            <p className="text-amber-800/80">{toDeliver.map((r) => `${r.title} (${byId.get(r.childId)?.name ?? "?"})`).join(", ")}</p>
          </div>
          <Link href="/parent/rewards" className="btn-ghost shrink-0">
            View
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Kids</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {children.map((kid) => {
            const s = stats[kid.id];
            const goal = activeGoal(rewards, kid.id);
            const assigned = chores.filter((c) => c.active && c.frequency === "daily" && c.childIds.includes(kid.id)).length;
            const doneToday = completions.filter(
              (c) => c.childId === kid.id && c.periodKey === today && c.status !== "rejected" && choreById.get(c.choreId)?.frequency === "daily",
            ).length;
            return (
              <li key={kid.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${kid.color}22` }}>
                    <PixelSprite creature={kid.creature} size={36} />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{kid.name}</p>
                    <p className="text-xs text-slate-500">
                      Level {s.level} · {s.lifetimeXp} XP lifetime · 🔥 {s.streak}-day streak
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Balance" value={`${s.balance} XP`} />
                  <Metric label="Today" value={`${doneToday}/${assigned}`} />
                  <Metric label="Unlocked" value={rewards.filter((r) => r.childId === kid.id && r.status !== "locked").length} />
                </dl>
                {goal ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">🎯 {goal.title}</span>
                      <span className="text-slate-500">
                        {Math.min(s.balance, goal.xpCost)}/{goal.xpCost}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (s.balance / goal.xpCost) * 100)}%`, background: kid.color }} />
                    </div>
                  </div>
                ) : (
                  <Link href="/parent/rewards" className="mt-4 block text-xs font-medium text-slate-500 underline">
                    No active goal — add a reward
                  </Link>
                )}
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
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <dd className="text-sm font-semibold">{value}</dd>
      <dt className="text-[11px] text-slate-500">{label}</dt>
    </div>
  );
}
