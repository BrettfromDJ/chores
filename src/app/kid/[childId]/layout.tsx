import { requireFamily } from "@/lib/auth/session";
import { loadChild } from "@/lib/queries";
import { KidNav } from "@/components/kid/KidNav";
import { KidTopBar } from "@/components/kid/KidTopBar";
import { LevelUp } from "@/components/kid/LevelUp";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children, params }: { children: React.ReactNode; params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await requireFamily();
  const { child, stats, ledger } = await loadChild(familyId, childId);
  // Celebrate a level-up bonus paid in the last 3 days (ledger is newest first).
  const levelUp = ledger.find((t) => t.kind === "level_up" && Date.now() - new Date(t.createdAt).getTime() < 3 * 86400_000);

  return (
    <div className="game-bg relative min-h-dvh overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <KidTopBar childId={child.id} balance={stats.balanceCents} streak={stats.streak} />
      <main className="relative mx-auto max-w-lg px-4 lg:max-w-6xl">{children}</main>
      <KidNav childId={child.id} />
      {levelUp && (
        <LevelUp
          txId={levelUp.id}
          level={Number(levelUp.note?.match(/\d+/)?.[0] ?? stats.level)}
          amount={levelUp.amountCents}
          creature={child.creature}
          kidName={child.name}
        />
      )}
    </div>
  );
}
