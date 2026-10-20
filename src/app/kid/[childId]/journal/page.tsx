import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { localDate } from "@/lib/game";
import { CoinIcon, LockIcon } from "@/components/game";
import { money, signedMoney, xp } from "@/lib/money";

type Entry =
  | { kind: "quest"; at: string; icon: string; title: string; xp: number; status: "pending" | "approved" | "rejected"; note: string | null }
  | { kind: "cash"; at: string; title: string; amount: number; icon: string };

export default async function JournalPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { badges, history, ledger, stats, timezone } = await loadChild(familyId, childId);
  const earned = badges.filter((b) => b.earned).length;

  const entries: Entry[] = [
    ...history.slice(0, 60).map((c) => ({ kind: "quest" as const, at: c.submittedAt, icon: c.choreIcon, title: c.choreTitle, xp: c.amountCents, status: c.status, note: c.note })),
    ...ledger
      .filter((t) => t.kind !== "earned")
      .map((t) => ({
        kind: "cash" as const,
        at: t.createdAt,
        title: t.note || (t.kind === "bonus" ? "Bonus" : t.kind === "level_up" ? "Level up!" : "Cashed out"),
        amount: t.amountCents,
        icon: t.kind === "level_up" ? "⭐" : t.kind === "bonus" ? "🎁" : "💵",
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const day = localDate(new Date(e.at), timezone);
    groups.set(day, [...(groups.get(day) ?? []), e]);
  }
  const today = localDate(new Date(), timezone);
  const dayLabel = (ymd: string) =>
    ymd === today ? "Today" : new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="space-y-6">
        <section className="grid grid-cols-3 gap-3 text-center">
          <Stat label={`Earned · ${money(stats.lifetimeCents, { compact: true })}`} value={xp(stats.lifetimeCents).replace(" XP", "")} />
          <Stat label="Quests" value={history.filter((c) => c.status === "approved").length} />
          <Stat label="Badges" value={`${earned}/${badges.length}`} />
        </section>

        <section className="panel p-4">
          <h2 className="text-game mb-3 text-[22px]">Badges</h2>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-4">
            {badges.map((b) => (
              <li key={b.id} className="flex flex-col items-center text-center">
                <div className={`slot aspect-square w-full ${b.earned ? "" : "slot-locked"}`}>
                  {b.earned ? (
                    <span className="animate-pop text-4xl drop-shadow-[0_3px_0_rgba(20,18,74,.4)]">{b.icon}</span>
                  ) : (
                    <>
                      <span className="text-3xl opacity-30 grayscale">{b.icon}</span>
                      <LockIcon size={20} className="absolute right-1.5 top-1.5" />
                      <span className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-night/30">
                        <span className="block h-full rounded-full bg-white" style={{ width: `${b.progress * 100}%` }} />
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1.5 font-display text-[13px] leading-tight">{b.name}</p>
                <p className="text-[10px] font-bold leading-tight text-white/60">{b.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel p-4">
        <h2 className="text-game mb-3 text-[22px]">Adventure log</h2>
        {groups.size === 0 && <p className="panel-row p-4 text-center text-sm font-bold text-white/75">Your story starts with your first quest!</p>}
        <div className="space-y-4">
          {[...groups].map(([day, list]) => (
            <div key={day}>
              <p className="mb-1.5 px-1 text-xs font-extrabold uppercase tracking-wider text-cyan-glow">{dayLabel(day)}</p>
              <ul className="space-y-1.5">
                {list.map((e, i) =>
                  e.kind === "cash" ? (
                    <li key={i} className="flex items-center gap-3 rounded-[14px] border-2 border-mint/60 bg-gradient-to-r from-mint/20 to-cyan-glow/10 px-3 py-2.5">
                      <span className="text-2xl">{e.icon}</span>
                      <p className="min-w-0 flex-1 truncate font-display text-[16px]">{e.title}</p>
                      <span className={`font-display text-sm ${e.amount > 0 ? "text-gold" : "text-pink-200"}`}>{signedMoney(e.amount)}</span>
                    </li>
                  ) : (
                    <li key={i} className="panel-row flex items-center gap-3 px-3 py-2.5">
                      <span className="text-xl">{e.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{e.title}</p>
                        {e.note && <p className="text-xs font-semibold text-white/60">“{e.note}”</p>}
                      </div>
                      {e.status === "approved" && (
                        <span className="flex items-center gap-1 font-display text-sm text-gold">
                          <CoinIcon size={16} />+{e.xp}
                        </span>
                      )}
                      {e.status === "pending" && <span className="font-display text-sm text-white/70">⏳ Waiting</span>}
                      {e.status === "rejected" && <span className="font-display text-sm text-pink-300">Try again</span>}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="panel px-2 py-3">
      <p className="text-game text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-cyan-glow">{label}</p>
    </div>
  );
}
