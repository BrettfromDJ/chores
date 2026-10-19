import Link from "next/link";
import { redirect } from "next/navigation";
import { isParentUnlocked, requireFamily } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { PinPad } from "./PinPad";

export const dynamic = "force-dynamic";

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const familyId = await requireFamily();
  const { next } = await searchParams;
  if (await isParentUnlocked(familyId)) redirect("/parent");
  const hasPin = Boolean(await repo.getPinHash(familyId));

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5 py-10 font-ui">
      <div className="w-full max-w-xs">
        <Link href="/" className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Back to trainers
        </Link>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl">🔒</div>
        <h1 className="text-center text-xl font-semibold tracking-tight text-slate-900">{hasPin ? "Parent area" : "Create a parent PIN"}</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {hasPin ? "Enter your PIN to approve quests and manage rewards." : "Kids won't be able to approve their own quests without it."}
        </p>
        <PinPad setup={!hasPin} next={next ?? "/parent"} />
      </div>
    </main>
  );
}
