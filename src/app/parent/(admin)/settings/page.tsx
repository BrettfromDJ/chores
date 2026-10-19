import { requireParent } from "@/lib/auth/session";
import { dataMode, repo } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import { PinForm, ResetDemoButton } from "@/components/parent/SettingsForms";

export default async function SettingsAdmin() {
  const familyId = await requireParent();
  const family = await repo.getFamily(familyId);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      <section className="card p-5">
        <h2 className="font-semibold">Parent PIN</h2>
        <p className="mb-4 text-sm text-slate-500">Required to open this dashboard and to approve quests. Unlocks last 20 minutes.</p>
        <PinForm />
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Data</h2>
        <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">Family</dt>
          <dd>{family?.name}</dd>
          <dt className="text-slate-500">Storage</dt>
          <dd>{dataMode === "demo" ? "Demo (local JSON file on the server)" : "Supabase"}</dd>
          <dt className="text-slate-500">Timezone</dt>
          <dd>{family?.timezone}</dd>
        </dl>
        {dataMode === "demo" && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <p className="text-sm text-slate-600">Restore the original demo kids, quests and rewards.</p>
            <ResetDemoButton />
          </div>
        )}
      </section>

      <section className="card flex items-center justify-between p-5">
        <div>
          <h2 className="font-semibold">Sign out</h2>
          <p className="text-sm text-slate-500">Kids will need a parent to sign back in on this device.</p>
        </div>
        <form action={signOut}>
          <button className="btn-danger">Sign out</button>
        </form>
      </section>
    </div>
  );
}
