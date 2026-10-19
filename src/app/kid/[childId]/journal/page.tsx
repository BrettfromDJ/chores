import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { localDate } from "@/lib/game";

type Entry =
  | { kind: "quest"; at: string; icon: string; title: string; xp: number; status: "pending" | "approved" | "rejected"; note: string | null }
  | { kind: "reward"; at: string; title: string };

export default async function JournalPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { badges, history, childRewards, stats, timezone } = await loadChild(familyId, childId);
  const earned = badges.filter((b) => b.earned).length;

  const entries: Entry[] = [
    ...history.slice(0, 60).map((c) => ({ kind: "quest" as const, at: c.submittedAt, icon: c.choreIcon, title: c.choreTitle, xp: c.xp, status: c.status, note: c.note })),
    ...childRewards.filter((r) => r.unlockedAt).map((r) => ({ kind: "reward" as const, at: r.unlockedAt!, title: r.title })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const day = localDate(new Date(e.at), timezone);
    groups.set(day, [...(groups.get(day) ?? []), e]);
  }
  const today = localDate(new Date(), timezone);
  const dayLabel = (ymd: string) => {
    if (ymd === today) return "Today";
    const d = new Date(`${ymd}T12:00:00Z`);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  };

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Total XP" value={stats.lifetimeXp} />
        <Stat label="Quests" value={history.filter((c) => c.status === "approved").length} />
        <Stat label="Badges" value={`${earned}/${badges.length}`} />
      </section>

      <section>
        <h2 className="mb-3 px-1 font-pixel text-[11px] uppercase">Badges</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {badges.map((b) => (
            <li key={b.id} className={`pixel-box flex flex-col items-center p-3 text-center ${b.earned ? "" : "!bg-paper-deep"}`}>
              <span className={`flex h-12 w-12 items-center justify-center text-2xl ${b.earned ? "animate-pop" : "opacity-40 grayscale"}`} aria-hidden>
                {b.icon}
              </span>
              <p className="mt-1 text-[12px] font-extrabold leading-tight">{b.name}</p>
              <p className="mt-1 text-[10px] font-semibold leading-tight text-ink-mute">{b.description}</p>
              {!b.earned && (
                <div className="mt-2 h-1.5 w-full bg-ink/15">
                  <div className="h-full bg-sky" style={{ width: `${b.progress * 100}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 px-1 font-pixel text-[11px] uppercase">Adventure log</h2>
        {groups.size === 0 && <div className="pixel-box p-5 text-center text-sm font-bold text-ink-mute">Your story starts with your first quest!</div>}
        <div className="space-y-5">
          {[...groups].map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-ink-mute">{dayLabel(day)}</p>
              <ul className="pixel-box divide-y-2 divide-dashed divide-ink/10">
                {list.map((e, i) =>
                  e.kind === "reward" ? (
                    <li key={i} className="flex items-center gap-3 bg-sun-light/60 px-3 py-3">
                      <span className="text-xl">🎁</span>
                      <p className="flex-1 font-extrabold">Unlocked {e.title}!</p>
                      <span className="font-pixel text-[8px] text-berry">REWARD</span>
                    </li>
                  ) : (
                    <li key={i} className="flex items-center gap-3 px-3 py-3">
                      <span className="text-xl">{e.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{e.title}</p>
                        {e.note && <p className="text-xs font-semibold text-ink-mute">“{e.note}”</p>}
                      </div>
                      {e.status === "approved" && <span className="font-pixel text-[9px] text-leaf-dark">+{e.xp}</span>}
                      {e.status === "pending" && <span className="font-pixel text-[8px] text-sun-dark">WAITING</span>}
                      {e.status === "rejected" && <span className="font-pixel text-[8px] text-ink-mute">RETRY</span>}
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
    <div className="pixel-box px-2 py-3">
      <p className="font-pixel text-sm">{value}</p>
      <p className="mt-2 text-[11px] font-extrabold uppercase text-ink-mute">{label}</p>
    </div>
  );
}
