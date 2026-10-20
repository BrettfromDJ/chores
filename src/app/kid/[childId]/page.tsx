import Link from "next/link";
import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { getCreature } from "@/lib/creatures";
import { CashIcon, CoinIcon, LevelMeter, Stage } from "@/components/game";
import { QuestCard } from "@/components/kid/QuestCard";
import { LEVEL_UP_BONUS, type QuestItem } from "@/lib/game";
import { money, xp } from "@/lib/money";

export default async function QuestsPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, board, stats, ledger } = await loadChild(familyId, childId);
  const creature = getCreature(child.creature);
  const doneToday = board.daily.filter((q) => q.completion).length;
  const empty = board.daily.length + board.weekly.length === 0;
  const weekAgo = Date.now() - 7 * 86400_000;
  const thisWeek = ledger.filter((t) => t.kind === "earned" && new Date(t.createdAt).getTime() > weekAgo).reduce((s, t) => s + t.amountCents, 0);
  const waiting = [...board.daily, ...board.weekly].filter((q) => q.completion?.status === "pending").reduce((s, q) => s + q.chore.amountCents, 0);

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
          <LevelMeter
            level={stats.level}
            value={stats.lifetimeCents - stats.levelFloor}
            max={stats.levelCeil - stats.levelFloor}
            caption={`${xp(stats.levelCeil - stats.lifetimeCents)} to level ${stats.level + 1} · +${money(LEVEL_UP_BONUS, { compact: true })} bonus`}
          />
        </div>

        <Link href={`/kid/${child.id}/wallet`} className="panel mt-6 block p-4 transition-transform active:scale-[.98] lg:hover:-translate-y-0.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-glow">My wallet</p>
          <div className="mt-1 flex items-center gap-3">
            <CoinIcon size={36} />
            <p className="text-game text-4xl leading-none">{stats.balanceCents.toLocaleString("en-US")}</p>
            <span className="font-display text-lg text-gold">XP</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-2xl border-2 border-mint/60 bg-mint/15 px-3 py-1.5 font-display text-xl text-mint">
              <CashIcon size={24} /> {money(stats.balanceCents)}
            </span>
          </div>
          <div className="mt-3 flex justify-between text-sm font-extrabold">
            <span className="text-white/75">This week: <span className="text-gold">+{xp(thisWeek)}</span></span>
            {waiting > 0 && <span className="text-white/75">⏳ {xp(waiting)} waiting</span>}
          </div>
        </Link>
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
            <p className="text-center text-xs font-bold text-white/55">100 XP = $1 · A parent checks each quest before XP goes in your wallet.</p>
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
              chore={{ id: q.chore.id, title: q.chore.title, description: q.chore.description, icon: q.chore.icon, amountCents: q.chore.amountCents }}
              status={q.completion?.status ?? null}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
