import { requireParent } from "@/lib/auth/session";
import { loadFamily } from "@/lib/queries";
import { ChildForm, Editable } from "@/components/parent/forms";
import { PixelSprite } from "@/components/PixelSprite";
import { getCreature } from "@/lib/creatures";

export default async function TrainersAdmin() {
  const familyId = await requireParent();
  const { children, stats } = await loadFamily(familyId);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Kids</h1>
        <p className="text-sm text-slate-500">Each kid gets their own profile, partner creature, XP and reward goals.</p>
      </div>
      <Editable summary={<span className="text-sm font-semibold">＋ Add a kid</span>} defaultOpen={children.length === 0}>
        <ChildForm />
      </Editable>
      <div className="space-y-2">
        {children.map((kid) => (
          <Editable
            key={kid.id}
            summary={
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: kid.color }}>
                  <PixelSprite creature={kid.creature} size={34} />
                </span>
                <div>
                  <p className="font-medium">{kid.name}</p>
                  <p className="text-xs text-slate-500">
                    {getCreature(kid.creature).name} · Level {stats[kid.id].level} · {stats[kid.id].lifetimeXp} XP
                  </p>
                </div>
              </div>
            }
          >
            <ChildForm child={kid} />
          </Editable>
        ))}
      </div>
    </div>
  );
}
