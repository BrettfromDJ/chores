import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { DeliveredToggle, Editable, RewardForm } from "@/components/parent/forms";
import { CardArt } from "@/components/CardArt";
import { Mascot } from "@/components/Mascot";
import type { Reward } from "@/lib/types";

export default async function RewardsAdmin() {
  const familyId = await requireParent();
  const { rewards, children, stats } = await loadFamily(familyId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Rewards</h1>
        <p className="text-sm text-slate-500">
          Each kid works through their goals in order. When their XP balance reaches the next goal, it unlocks automatically and the XP is spent.
        </p>
      </div>

      {children.length > 0 && (
        <Editable summary={<span className="text-sm font-semibold">＋ New reward</span>}>
          <RewardForm kids={children} nextOrder={Math.max(0, ...rewards.map((r) => r.sortOrder)) + 1} />
        </Editable>
      )}

      {children.map((kid) => {
        const mine = rewards.filter((r) => r.childId === kid.id).sort((a, b) => a.sortOrder - b.sortOrder);
        const locked = mine.filter((r) => r.status === "locked");
        const earned = mine.filter((r) => r.status !== "locked");
        return (
          <section key={kid.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Mascot creature={kid.creature} size={24} />
              <h2 className="font-semibold">{kid.name}</h2>
              <span className="text-sm text-slate-500">· {stats[kid.id].balance} XP available</span>
            </div>

            <div className="space-y-2">
              {locked.map((r, i) => (
                <Editable key={r.id} summary={<RewardSummary reward={r} badge={i === 0 ? "Current goal" : `Goal ${i + 1}`} progress={i === 0 ? stats[kid.id].balance / r.xpCost : undefined} />}>
                  <RewardForm reward={r} kids={children} />
                </Editable>
              ))}
              {locked.length === 0 && <p className="card px-4 py-3 text-sm text-slate-500">No upcoming goals for {kid.name}. Add one so there&apos;s always something to work toward.</p>}
            </div>

            {earned.length > 0 && (
              <div className="card divide-y divide-indigo-50">
                {earned.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <CardArt imageUrl={r.imageUrl} title={r.title} mini className="w-9 shrink-0 !border-2 !p-[3px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-slate-500">
                        Unlocked {r.unlockedAt ? new Date(r.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                        {r.revealedAt ? " · seen by kid" : " · not opened yet"}
                      </p>
                    </div>
                    <DeliveredToggle reward={r} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RewardSummary({ reward, badge, progress }: { reward: Reward; badge: string; progress?: number }) {
  return (
    <div className="flex items-center gap-3">
      <CardArt imageUrl={reward.imageUrl} title={reward.title} mini className="w-9 shrink-0 !border-2 !p-[3px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{reward.title}</p>
        <p className="text-xs text-slate-500">{badge}</p>
        {progress !== undefined && (
          <div className="mt-1.5 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-indigo-50">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
        )}
      </div>
      <span className="shrink-0 text-sm font-semibold">{reward.xpCost} XP</span>
    </div>
  );
}
