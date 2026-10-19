import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { CardArt } from "@/components/CardArt";
import { GameBar, GlowStage, LockIcon } from "@/components/game";
import { TrophyCase } from "@/components/kid/TrophyCase";

export default async function RewardsPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, childRewards, goal, stats } = await loadChild(familyId, childId);
  const upcoming = childRewards.filter((r) => r.status === "locked" && r.id !== goal?.id);
  const earned = childRewards.filter((r) => r.status !== "locked").sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,420px)_1fr] lg:gap-10">
      {goal ? (
        <section className="animate-slide-up">
          <GlowStage className="h-[300px] pt-4">
            <CardArt imageUrl={goal.imageUrl} title={goal.title} xpCost={goal.xpCost} locked className="relative w-44 animate-bob" />
          </GlowStage>
          <div className="panel mt-4 p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-glow">Next reward</p>
            <h2 className="text-game mt-0.5 text-3xl leading-tight">{goal.title}</h2>
            {goal.description && <p className="mt-1 font-bold text-white/75">{goal.description}</p>}
            <GameBar
              className="mt-4"
              height="h-8"
              value={stats.balance}
              max={goal.xpCost}
              from="#ffe066"
              to="#f5a000"
              ariaLabel="Reward progress"
              label={`${Math.min(stats.balance, goal.xpCost)} / ${goal.xpCost} XP`}
            />
            <p className="panel-row mt-4 px-3 py-2.5 text-sm font-bold text-white/85">
              {stats.balance >= goal.xpCost
                ? "Your bar is full — it'll unlock any second!"
                : `${goal.xpCost - stats.balance} XP to go! Finish quests and get them approved — the reward unlocks automatically.`}
            </p>
          </div>
        </section>
      ) : (
        <section className="panel p-6 text-center">
          <p className="text-game text-2xl">🏆 All goals unlocked!</p>
          <p className="mt-1 font-bold text-white/75">Ask a parent to pick your next reward.</p>
        </section>
      )}

      <div className="space-y-6">
        {upcoming.length > 0 && (
          <section className="panel p-4">
            <h2 className="text-game mb-3 text-[22px]">Coming up</h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {upcoming.map((r) => (
                <li key={r.id} className="text-center">
                  <div className="slot slot-locked aspect-square">
                    <LockIcon size={30} />
                  </div>
                  <p className="mt-1.5 truncate font-display text-sm">{r.title}</p>
                  <p className="text-xs font-extrabold text-gold">{r.xpCost} XP</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="panel p-4">
          <h2 className="text-game mb-3 text-[22px]">Trophy case</h2>
          {earned.length ? (
            <TrophyCase
              childId={child.id}
              kidName={child.name}
              rewards={earned.map((r) => ({ id: r.id, title: r.title, description: r.description, imageUrl: r.imageUrl, xpCost: r.xpCost, status: r.status }))}
            />
          ) : (
            <p className="panel-row p-4 text-center text-sm font-bold text-white/75">Your unlocked cards will shine here ✨</p>
          )}
        </section>
      </div>
    </div>
  );
}
