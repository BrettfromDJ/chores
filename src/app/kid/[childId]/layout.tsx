import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { KidNav } from "@/components/kid/KidNav";
import { KidTopBar } from "@/components/kid/KidTopBar";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children, params }: { children: React.ReactNode; params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, stats } = await loadChild(familyId, childId);

  return (
    <div className="game-bg relative min-h-dvh overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <KidTopBar childId={child.id} balance={stats.balanceCents} streak={stats.streak} />
      <main className="relative mx-auto max-w-lg px-4 lg:max-w-6xl">{children}</main>
      <KidNav childId={child.id} />
    </div>
  );
}
