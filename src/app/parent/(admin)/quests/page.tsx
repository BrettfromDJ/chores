import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { ChoreForm, Editable } from "@/components/parent/forms";
import { Mascot } from "@/components/Mascot";
import type { Child, Chore } from "@/lib/types";

export default async function QuestsAdmin() {
  const familyId = await requireParent();
  const { chores, children } = await loadFamily(familyId);
  const groups = [
    { label: "Daily", items: chores.filter((c) => c.frequency === "daily") },
    { label: "Weekly", items: chores.filter((c) => c.frequency === "weekly") },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Quests</h1>
          <p className="text-sm text-slate-500">Daily quests reset each morning, weekly quests every Monday.</p>
        </div>
      </div>

      <Editable summary={<span className="text-sm font-semibold">＋ New quest</span>} defaultOpen={chores.length === 0}>
        <ChoreForm kids={children} />
      </Editable>

      {groups.map((g) => (
        <section key={g.label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {g.label} · {g.items.length}
          </h2>
          <div className="space-y-2">
            {g.items.map((chore) => (
              <Editable key={chore.id} summary={<ChoreSummary chore={chore} kids={children} />}>
                <ChoreForm chore={chore} kids={children} />
              </Editable>
            ))}
            {g.items.length === 0 && <p className="card px-4 py-3 text-sm text-slate-500">No {g.label.toLowerCase()} quests yet.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}

function ChoreSummary({ chore, kids }: { chore: Chore; kids: Child[] }) {
  const assigned = kids.filter((k) => chore.childIds.includes(k.id));
  return (
    <div className={`flex items-center gap-3 ${chore.active ? "" : "opacity-50"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">{chore.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">
          {chore.title}
          {!chore.active && <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] text-slate-500">Paused</span>}
        </p>
        <div className="mt-0.5 flex items-center gap-1">
          {assigned.map((k) => (
            <Mascot key={k.id} creature={k.creature} size={16} title={k.name} />
          ))}
          {assigned.length === 0 && <span className="text-xs text-amber-700">Not assigned</span>}
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-emerald-600">{chore.xp} XP</span>
    </div>
  );
}
