import Link from "next/link";
import { requireFamily } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { CashIcon, CoinIcon, GlowStage, LockIcon } from "@/components/game";
import { Mascot } from "@/components/Mascot";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function TrainerSelect() {
  const familyId = await requireFamily();
  const { family, children, stats, completions } = await loadFamily(familyId);

  return (
    <main className="game-bg relative min-h-dvh overflow-x-hidden pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-none absolute left-0 top-0 h-28 w-80 bg-night/70 [clip-path:polygon(0_0,100%_0,0_100%)]" aria-hidden />
      <div className="relative mx-auto max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] lg:max-w-5xl">
        <header className="flex items-start justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-cyan-glow">{family?.name ?? "Your family"}</p>
            <h1 className="text-game text-4xl leading-tight">Choose your trainer</h1>
          </div>
          <Link href="/parent" className="btn-game btn-lilac shrink-0 !px-3 !py-2.5 !text-base" aria-label="Parent area">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path d="M7.5 10V7.5a4.5 4.5 0 019 0V10" fill="none" stroke="#2f22b0" strokeWidth="3" strokeLinecap="round" />
              <rect x="5" y="10" width="14" height="11" rx="3" fill="#2f22b0" />
            </svg>
            Parent
          </Link>
        </header>

        {children.length === 0 ? (
          <div className="panel mt-8 p-6 text-center">
            <Mascot creature="pebblit" size={110} className="mx-auto animate-bob" />
            <p className="text-game mt-3 text-2xl">No trainers yet!</p>
            <p className="mt-1 font-bold text-white/75">A parent can add kids in the Parent area.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,340px))] lg:justify-center">
            {children.map((child, i) => {
              const s = stats[child.id];
              const pending = completions.filter((c) => c.childId === child.id && c.status === "pending").length;
              return (
                <li key={child.id} className="animate-slide-up" style={{ animationDelay: `${i * 90}ms` }}>
                  <Link href={`/kid/${child.id}`} className="panel group block overflow-hidden p-4 transition-transform active:scale-[.98] lg:hover:-translate-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-game text-3xl leading-none">{child.name}</p>
                        <p className="mt-1 font-display text-lg text-cyan-glow drop-shadow-[0_2px_0_#14124a]">{s.levelTitle}</p>
                      </div>
                      <span className="rounded-lg border-2 border-white/70 bg-lilac px-2 py-0.5 font-display text-sm text-night">Lv {s.level}</span>
                    </div>
                    <GlowStage className="-mx-4 h-44" arrows={false}>
                      <Mascot creature={child.creature} size={150} className="relative animate-bob drop-shadow-[0_10px_16px_rgba(20,18,74,.45)]" />
                    </GlowStage>
                    <div className="mt-1 flex items-center justify-between text-sm font-extrabold">
                      <span className="text-white/80">🔥 {s.streak}-day streak</span>
                      {pending > 0 && <span className="text-gold">⏳ {pending} waiting</span>}
                    </div>
                    <div className="panel-row mt-2 flex items-center gap-2 px-3 py-2">
                      <CoinIcon size={22} />
                      <span className="font-display text-lg">{s.balanceCents.toLocaleString("en-US")} XP</span>
                      <span className="ml-auto flex items-center gap-1.5 font-display text-lg text-mint">
                        <CashIcon size={22} /> {money(s.balanceCents)}
                      </span>
                    </div>
                    <span className="btn-game btn-yellow mt-4 w-full !py-3.5 !text-2xl">Play</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-white/50">
          <LockIcon size={14} /> 100 XP = $1 · XP is only paid after a parent approves.
        </p>
      </div>
    </main>
  );
}
