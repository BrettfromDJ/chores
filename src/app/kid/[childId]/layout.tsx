import Link from "next/link";
import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { PixelSprite } from "@/components/PixelSprite";
import { XpBar } from "@/components/XpBar";
import { KidNav } from "@/components/kid/KidNav";
import { RewardUnlock } from "@/components/kid/RewardUnlock";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children, params }: { children: React.ReactNode; params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, stats, unrevealed } = await loadChild(familyId, childId);
  const toNext = stats.levelCeil - stats.lifetimeXp;

  return (
    <div className="bg-dots min-h-dvh pb-[calc(6.5rem+env(safe-area-inset-bottom))]" style={{ ["--kid" as string]: child.color }}>
      <header className="sticky top-0 z-20 border-b-4 border-ink bg-ink pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 sm:max-w-2xl">
          <Link href="/" aria-label="Switch trainer" className="relative shrink-0">
            <span className="bg-scanlines flex h-14 w-14 items-end justify-center border-[3px] border-white" style={{ background: child.color }}>
              <PixelSprite creature={child.creature} size={48} className="animate-bob" />
            </span>
            <span className="absolute -bottom-2 -right-2 bg-sun px-1 py-0.5 font-pixel text-[7px] text-ink">⇄</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-pixel text-[11px]">{child.name}</p>
              <p className="shrink-0 font-pixel text-[9px] text-sun">LV {stats.level}</p>
            </div>
            <p className="mt-1 text-[11px] font-bold text-white/60">
              {stats.levelTitle} · {toNext} XP to LV {stats.level + 1}
            </p>
            <XpBar className="mt-1.5 !h-3.5 !border-white/80" value={stats.lifetimeXp - stats.levelFloor} max={stats.levelCeil - stats.levelFloor} color="#ffcc33" segments={16} label="Level progress" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 font-pixel text-[9px]" title="XP to spend on rewards">
              <Coin /> {stats.balance}
            </span>
            <span className="bg-white/10 px-2 py-1 font-pixel text-[9px]" title="Day streak">
              🔥 {stats.streak}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-5 sm:max-w-2xl">{children}</main>

      <KidNav childId={child.id} />
      {unrevealed && <RewardUnlock childId={child.id} reward={unrevealed} kidName={child.name} />}
    </div>
  );
}

function Coin() {
  return (
    <svg width="12" height="12" viewBox="0 0 6 6" className="pixelated" aria-hidden>
      <path d="M2 0h2v1h1v1h1v2H5v1H4v1H2V5H1V4H0V2h1V1h1z" fill="#ffcc33" />
      <path d="M2 1h1v1H2zM1 2h1v1H1z" fill="#fff" />
    </svg>
  );
}
