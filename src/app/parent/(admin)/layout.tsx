import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { repo, dataMode } from "@/lib/data";
import { lock } from "@/app/actions/auth";
import { AdminNav } from "@/components/parent/AdminNav";
import { Toaster } from "@/components/parent/Flash";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const familyId = await requireParent();
  const [family, completions] = await Promise.all([repo.getFamily(familyId), repo.listCompletions(familyId)]);
  const pending = completions.filter((c) => c.status === "pending").length;

  return (
    <div className="admin min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/parent" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-royal-light to-royal-dark font-display text-[15px] text-gold shadow-[inset_0_2px_0_rgba(255,255,255,.3)]">PQ</span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{family?.name ?? "Family"}</span>
              <span className="block text-xs text-slate-500">Parent dashboard{dataMode === "demo" ? " · Demo" : ""}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost">
              Kid view
            </Link>
            <form action={lock}>
              <button className="btn-primary" title="Lock the parent area">
                🔒 <span className="hidden sm:inline">Lock</span>
              </button>
            </form>
          </div>
        </div>
        <AdminNav pending={pending} />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">{children}</main>
      <Toaster />
    </div>
  );
}
