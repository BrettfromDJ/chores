import Link from "next/link";
import { requireFamily } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { activeGoal } from "@/lib/game";
import { getCreature } from "@/lib/creatures";
import { PixelSprite } from "@/components/PixelSprite";
import { XpBar } from "@/components/XpBar";

export const dynamic = "force-dynamic";

export default async function TrainerSelect() {
  const familyId = await requireFamily();
  const { family, children, stats, rewards, completions } = await loadFamily(familyId);

  return (
    <main className="bg-dots min-h-dvh pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg px-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-3xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="pixel-label text-ink-mute">{family?.name ?? "Your family"}</p>
            <h1 className="mt-2 font-pixel text-lg leading-snug">Who&apos;s playing?</h1>
          </div>
          <Link href="/parent" className="pixel-btn !px-3 !py-2.5" style={{ ["--btn" as string]: "#1d1a2f" }} aria-label="Parent area">
            <LockIcon /> Parent
          </Link>
        </header>

        {children.length === 0 ? (
          <div className="pixel-box mt-8 p-6 text-center">
            <PixelSprite creature="pebblit" size={72} className="mx-auto animate-bob" />
            <p className="mt-4 font-bold">No trainers yet!</p>
            <p className="mt-1 text-sm text-ink-mute">A parent can add kids in the Parent area.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {children.map((child, i) => {
              const s = stats[child.id];
              const goal = activeGoal(rewards, child.id);
              const pending = completions.filter((c) => c.childId === child.id && c.status === "pending").length;
              const creature = getCreature(child.creature);
              return (
                <li key={child.id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <Link href={`/kid/${child.id}`} className="pixel-box group block overflow-hidden transition-transform active:scale-[.98] sm:hover:-translate-y-1">
                    <div className="bg-scanlines relative flex h-32 items-end justify-center" style={{ background: `linear-gradient(180deg, ${child.color}, ${child.color}cc)` }}>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-black/15" />
                      <PixelSprite creature={child.creature} size={104} className="relative -mb-1 animate-bob drop-shadow-[0_4px_0_rgba(0,0,0,.2)]" />
                      <span className="absolute left-3 top-3 bg-white/90 px-2 py-1 font-pixel text-[8px] uppercase text-ink">{creature.element}</span>
                      {s.streak > 0 && <span className="absolute right-3 top-3 bg-white/90 px-2 py-1 font-pixel text-[8px] text-ink">🔥 {s.streak}</span>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-baseline justify-between">
                        <p className="font-pixel text-sm">{child.name}</p>
                        <p className="font-pixel text-[10px] text-ink-mute">Lv {s.level}</p>
                      </div>
                      <XpBar className="mt-3" value={s.lifetimeXp - s.levelFloor} max={s.levelCeil - s.levelFloor} color={child.color} label="Level progress" />
                      <div className="mt-3 flex items-center justify-between text-sm font-bold text-ink-soft">
                        <span>{goal ? `🎯 ${goal.title}` : "🏆 All goals unlocked!"}</span>
                        {pending > 0 && <span className="text-xs text-sun-dark">⏳ {pending}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function LockIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 5 6" className="pixelated" aria-hidden>
      <path d="M1 0h3v1h1v2H4V1H1v2H0V1h1zM0 3h5v3H0z" fill="currentColor" />
    </svg>
  );
}
