import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { localDate } from "@/lib/game";
import { money, signedMoney, signedXp, xp } from "@/lib/money";
import { CashIcon, CoinIcon, GlowStage } from "@/components/game";
import { Mascot } from "@/components/Mascot";
import type { Transaction } from "@/lib/types";

const KIND = {
  earned: { icon: "⚔️", label: "Quest" },
  bonus: { icon: "🎁", label: "Bonus" },
  payout: { icon: "💵", label: "Cashed out" },
} as const;

export default async function WalletPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, stats, ledger, completions, board, timezone } = await loadChild(familyId, childId);
  const titles = new Map(completions.map((c) => [c.id, c.choreTitle]));
  const describe = (t: Transaction) => (t.kind === "earned" ? (titles.get(t.refId ?? "") ?? "Quest") : t.note || KIND[t.kind].label);

  const weekAgo = Date.now() - 7 * 86400_000;
  const thisWeek = ledger.filter((t) => t.kind === "earned" && new Date(t.createdAt).getTime() > weekAgo).reduce((s, t) => s + t.amountCents, 0);
  const cashedOut = ledger.filter((t) => t.kind === "payout").reduce((s, t) => s - t.amountCents, 0);
  const waiting = [...board.daily, ...board.weekly].filter((q) => q.completion?.status === "pending").reduce((s, q) => s + q.chore.amountCents, 0);
  const dayLabel = (iso: string) =>
    new Date(`${localDate(new Date(iso), timezone)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,440px)_1fr] lg:gap-10">
      <div className="space-y-5">
        <GlowStage className="h-[210px]" arrows={false}>
          <div className="relative flex items-end">
            <Mascot creature={child.creature} size={150} className="relative z-10 animate-bob drop-shadow-[0_10px_16px_rgba(20,18,74,.45)]" />
            <span className="absolute -right-10 bottom-6 animate-bob text-5xl [animation-delay:.4s]" aria-hidden>
              🪙
            </span>
            <span className="absolute -left-10 bottom-12 animate-bob text-4xl [animation-delay:.9s]" aria-hidden>
              💵
            </span>
          </div>
        </GlowStage>

        <section className="panel relative overflow-hidden p-5 animate-slide-up">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-magenta-glow/30 blur-2xl" aria-hidden />
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-glow">{child.name}&apos;s wallet</p>
          <div className="mt-2 flex items-center gap-3">
            <CoinIcon size={48} />
            <div>
              <p className="text-game text-5xl leading-none">{stats.balanceCents.toLocaleString("en-US")}</p>
              <p className="font-display text-lg text-gold">XP</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-mint/60 bg-mint/15 px-4 py-3">
            <span className="font-display text-lg text-white/85">Worth</span>
            <span className="flex items-center gap-2 font-display text-3xl text-mint">
              <CashIcon size={32} /> {money(stats.balanceCents)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="This week" value={signedXp(thisWeek)} />
            <Stat label="All-time" value={money(stats.lifetimeCents)} />
            <Stat label="Cashed out" value={money(cashedOut)} />
          </div>
          {waiting > 0 && <p className="panel-row mt-3 px-3 py-2 text-center text-sm font-bold text-gold">⏳ {xp(waiting)} ({money(waiting)}) waiting for a parent to approve</p>}
          <p className="mt-3 text-center text-xs font-bold text-white/55">100 XP = $1 · Ask a parent when you want to cash out.</p>
        </section>
      </div>

      <section className="panel p-4">
        <h2 className="text-game mb-3 text-[22px]">Wallet history</h2>
        {ledger.length === 0 && <p className="panel-row p-4 text-center text-sm font-bold text-white/75">Finish a quest to earn your first XP!</p>}
        <ul className="space-y-1.5">
          {ledger.slice(0, 60).map((t) => (
            <li key={t.id} className="panel-row flex items-center gap-3 px-3 py-2.5">
              <span className="text-xl" aria-hidden>
                {KIND[t.kind].icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{describe(t)}</p>
                <p className="text-xs font-semibold text-white/55">
                  {KIND[t.kind].label} · {dayLabel(t.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-display text-[15px] ${t.amountCents > 0 ? "text-gold" : "text-pink-200"}`}>{signedXp(t.amountCents)}</p>
                <p className="text-xs font-extrabold text-white/55">{signedMoney(t.amountCents)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-row px-1 py-2">
      <p className="font-display text-[15px]">{value}</p>
      <p className="text-[10px] font-extrabold uppercase text-white/60">{label}</p>
    </div>
  );
}
