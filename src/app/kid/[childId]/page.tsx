import Link from "next/link";
import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { getCreature } from "@/lib/creatures";
import { CardArt } from "@/components/CardArt";
import { GameBar, LevelMeter, Stage } from "@/components/game";
import { QuestCard } from "@/components/kid/QuestCard";
import type { QuestItem } from "@/lib/game";

export default async function QuestsPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, board, goal, stats } = await loadChild(familyId, childId);
  const creature = getCreature(child.creature);
  const doneToday = board.daily.filter((q) => q.completion).length;
  const empty = board.daily.length + board.weekly.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] lg:items-start lg:gap-8">
      {/* Left: trainer info */}
      <section className="relative z-10 animate-slide-up lg:order-1 lg:pt-6">
        <h2 className="text-game text-5xl leading-none">{child.name}</h2>
        <p className="mt-1 font-display text-xl text-cyan-glow drop-shadow-[0_2px_0_#14124a]">{stats.levelTitle}</p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-lg border-2 border-white/70 bg-lilac px-2 py-1 text-night">
          <span className="text-[10px] font-extrabold uppercase leading-none opacity-70">
            Partner
            <br />
            <span className="font-display text-[15px] normal-case leading-none opacity-100">
              {creature.name} · {creature.element}
            </span>
          </span>
        </span>
        <div className="mt-5 max-w-sm">
          <LevelMeter level={stats.level} value={stats.lifetimeXp - stats.levelFloor} max={stats.levelCeil - stats.levelFloor} caption={`${stats.levelCeil - stats.lifetimeXp} XP to level ${stats.level + 1}`} />
        </div>

        {goal ? (
          <Link href={`/kid/${child.id}/rewards`} className="panel mt-6 flex items-center gap-4 p-3 transition-transform active:scale-[.98] lg:hover:-translate-y-0.5">
            <CardArt imageUrl={goal.imageUrl} title={goal.title} locked mini className="w-16 shrink-0 -rotate-6" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-glow">Next reward</p>
              <p className="text-game truncate text-xl">{goal.title}</p>
              <GameBar
                className="mt-1.5"
                value={stats.balance}
                max={goal.xpCost}
                from="#ffe066"
                to="#f5a000"
                ariaLabel="Reward progress"
                label={stats.balance >= goal.xpCost ? "Ready!" : `${stats.balance}/${goal.xpCost} XP`}
              />
            </div>
          </Link>
        ) : (
          <div className="panel mt-6 p-4 text-center font-bold">🏆 Every goal unlocked! Ask a parent for your next reward.</div>
        )}
      </section>

      {/* Center: partner on stage */}
      <Stage creature={child.creature} size={210} className="order-first -my-2 h-[250px] lg:order-2 lg:mt-6 lg:h-[440px]" />

      {/* Right: quests */}
      <section className="panel animate-slide-up p-4 [animation-delay:.1s] lg:order-3">
        {empty ? (
          <p className="py-8 text-center font-bold text-white/80">No quests yet! Ask a parent to add some.</p>
        ) : (
          <div className="space-y-5">
            <QuestGroup title="Daily Quests" hint={`${doneToday}/${board.daily.length} today`} items={board.daily} childId={child.id} />
            <QuestGroup title="Weekly Quests" hint="Resets Monday" items={board.weekly} childId={child.id} />
            <p className="text-center text-xs font-bold text-white/55">A parent checks each quest before your XP is added.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function QuestGroup({ title, hint, items, childId }: { title: string; hint: string; items: QuestItem[]; childId: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-game text-[22px]">{title}</h3>
        <span className="text-sm font-extrabold text-cyan-glow">{hint}</span>
      </div>
      <ul className="space-y-2">
        {items.map((q, i) => (
          <li key={q.chore.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <QuestCard
              childId={childId}
              chore={{ id: q.chore.id, title: q.chore.title, description: q.chore.description, icon: q.chore.icon, xp: q.chore.xp }}
              status={q.completion?.status ?? null}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
