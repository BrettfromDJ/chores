import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { CardArt } from "@/components/CardArt";
import { XpBar } from "@/components/XpBar";
import { TrophyCase } from "@/components/kid/TrophyCase";

export default async function RewardsPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, childRewards, goal, stats } = await loadChild(familyId, childId);
  const upcoming = childRewards.filter((r) => r.status === "locked" && r.id !== goal?.id);
  const earned = childRewards.filter((r) => r.status !== "locked").sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));

  return (
    <div className="space-y-8">
      {goal && (
        <section className="pixel-box overflow-hidden animate-slide-up">
          <div className="bg-scanlines flex justify-center px-6 pb-6 pt-8" style={{ background: `linear-gradient(180deg, ${child.color}, ${child.color}99)` }}>
            <CardArt imageUrl={goal.imageUrl} title={goal.title} xpCost={goal.xpCost} locked className="w-40 animate-bob" />
          </div>
          <div className="p-5">
            <p className="pixel-label text-berry">Next reward</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight">{goal.title}</h2>
            {goal.description && <p className="mt-1 font-semibold text-ink-mute">{goal.description}</p>}
            <XpBar className="mt-4 !h-6" value={stats.balance} max={goal.xpCost} color={child.color} segments={20} label="Goal progress" />
            <div className="mt-2 flex justify-between font-pixel text-[10px]">
              <span>{Math.min(stats.balance, goal.xpCost)} XP</span>
              <span className="text-ink-mute">{goal.xpCost} XP</span>
            </div>
            <p className="mt-4 rounded bg-paper-deep px-3 py-2 text-sm font-bold text-ink-soft">
              Finish quests and get them approved — when your bar fills up, the reward unlocks automatically!
            </p>
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 font-pixel text-[11px] uppercase">Coming up</h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {upcoming.map((r) => (
              <li key={r.id}>
                <CardArt imageUrl={r.imageUrl} title={r.title} xpCost={r.xpCost} locked />
                <p className="mt-2 truncate text-center text-xs font-bold">{r.title}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 px-1 font-pixel text-[11px] uppercase">Trophy case</h2>
        {earned.length ? (
          <TrophyCase
            childId={child.id}
            kidName={child.name}
            rewards={earned.map((r) => ({ id: r.id, title: r.title, description: r.description, imageUrl: r.imageUrl, xpCost: r.xpCost, status: r.status }))}
          />
        ) : (
          <div className="pixel-box p-5 text-center text-sm font-bold text-ink-mute">Your unlocked cards will shine here ✨</div>
        )}
      </section>
    </div>
  );
}
