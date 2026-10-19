import Link from "next/link";
import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { CardArt } from "@/components/CardArt";
import { XpBar } from "@/components/XpBar";
import { PixelSprite } from "@/components/PixelSprite";
import { QuestCard } from "@/components/kid/QuestCard";
import type { QuestItem } from "@/lib/game";

export default async function QuestsPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, board, goal, stats } = await loadChild(familyId, childId);
  const all = [...board.daily, ...board.weekly];
  const doneToday = board.daily.filter((q) => q.completion).length;

  return (
    <div className="space-y-6">
      {goal ? (
        <Link href={`/kid/${child.id}/rewards`} className="pixel-box flex items-center gap-4 p-4 animate-slide-up">
          <CardArt imageUrl={goal.imageUrl} title={goal.title} locked mini className="w-20 shrink-0 -rotate-3" />
          <div className="min-w-0 flex-1">
            <p className="pixel-label text-berry">Current goal</p>
            <p className="mt-1.5 truncate text-lg font-extrabold leading-tight">{goal.title}</p>
            <XpBar className="mt-3" value={stats.balance} max={goal.xpCost} color={child.color} segments={14} label="Goal progress" />
            <p className="mt-2 text-sm font-bold text-ink-mute">
              {stats.balance >= goal.xpCost ? "Ready to unlock!" : <><b className="text-ink">{goal.xpCost - stats.balance} XP</b> to go</>}
            </p>
          </div>
        </Link>
      ) : (
        <div className="pixel-box p-4 text-center">
          <p className="font-bold">🏆 Every goal unlocked!</p>
          <p className="text-sm text-ink-mute">Ask a parent to pick your next reward.</p>
        </div>
      )}

      <Section
        title="Daily Quests"
        hint={board.daily.length ? `${doneToday}/${board.daily.length} today` : undefined}
        items={board.daily}
        childId={child.id}
        color={child.color}
      />
      <Section title="Weekly Quests" hint="Resets Monday" items={board.weekly} childId={child.id} color={child.color} />

      {all.length === 0 && (
        <div className="pixel-box p-6 text-center">
          <PixelSprite creature={child.creature} size={64} className="mx-auto animate-bob" />
          <p className="mt-3 font-bold">No quests yet!</p>
          <p className="text-sm text-ink-mute">Ask a parent to add some.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, hint, items, childId, color }: { title: string; hint?: string; items: QuestItem[]; childId: string; color: string }) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-pixel text-[11px] uppercase">{title}</h2>
        {hint && <span className="text-xs font-bold text-ink-mute">{hint}</span>}
      </div>
      <ul className="space-y-3">
        {items.map((q, i) => (
          <li key={q.chore.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <QuestCard
              childId={childId}
              color={color}
              chore={{ id: q.chore.id, title: q.chore.title, description: q.chore.description, icon: q.chore.icon, xp: q.chore.xp }}
              status={q.completion?.status ?? null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
