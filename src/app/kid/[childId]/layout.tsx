import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { KidNav } from "@/components/kid/KidNav";
import { KidTopBar } from "@/components/kid/KidTopBar";
import { RewardUnlock } from "@/components/kid/RewardUnlock";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children, params }: { children: React.ReactNode; params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, stats, unrevealed, badges } = await loadChild(familyId, childId);

  return (
    <div className="game-bg relative min-h-dvh overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <KidTopBar childId={child.id} balance={stats.balance} streak={stats.streak} badges={badges.filter((b) => b.earned).length} />
      <main className="relative mx-auto max-w-lg px-4 lg:max-w-6xl">{children}</main>
      <KidNav childId={child.id} />
      {unrevealed && <RewardUnlock childId={child.id} reward={unrevealed} kidName={child.name} />}
    </div>
  );
}
