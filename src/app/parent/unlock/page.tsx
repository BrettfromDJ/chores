import { redirect } from "next/navigation";
import { isParentUnlocked, requireFamily } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { BackButton, LockIcon } from "@/components/game";
import { PinPad } from "./PinPad";

export const dynamic = "force-dynamic";

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const familyId = await requireFamily();
  const { next } = await searchParams;
  if (await isParentUnlocked(familyId)) redirect("/parent");
  const hasPin = Boolean(await repo.getPinHash(familyId));

  return (
    <main className="game-bg flex min-h-dvh flex-col items-center px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-xs items-center py-3">
        <BackButton href="/" label="Back to trainers" />
      </div>
      <div className="mt-4 w-full max-w-xs">
        <div className="slot slot-locked mx-auto h-16 w-16">
          <LockIcon size={34} />
        </div>
        <h1 className="text-game mt-4 text-center text-3xl">{hasPin ? "Parents only!" : "Create a parent PIN"}</h1>
        <p className="mt-1 text-center font-bold text-white/70">
          {hasPin ? "Enter your PIN to approve quests and manage money." : "Kids won't be able to approve their own quests without it."}
        </p>
        <PinPad setup={!hasPin} next={next ?? "/parent"} />
      </div>
    </main>
  );
}
