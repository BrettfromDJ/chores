"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import { demoReset } from "@/lib/data/demo";
import { dataMode } from "@/lib/data";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { assertParent } from "@/lib/auth/session";
import { money, xp } from "@/lib/money";
import { cents, color, creature, frequency, guard, int, pin, str, type ActionResult } from "@/lib/validate";

/* Every action here re-checks the parent PIN cookie on the server. */

function refresh() {
  revalidatePath("/", "layout");
}

export async function reviewQuest(completionId: string, approve: boolean, note?: string): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    const clean = note?.trim().slice(0, 200) || null;
    const completion = await repo.reviewCompletion(familyId, completionId, approve, clean);
    if (!approve) return "Sent back for another try.";
    return `+${xp(completion.amountCents)} (${money(completion.amountCents)}) added to the wallet.`;
  });
  refresh();
  return result;
}

export async function approveAll(completionIds: string[]): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    let total = 0;
    const ids = completionIds.slice(0, 100);
    for (const id of ids) total += (await repo.reviewCompletion(familyId, id, true, null)).amountCents;
    return `Approved ${ids.length} quests (+${xp(total)} · ${money(total)}).`;
  });
  refresh();
  return result;
}

export async function saveChore(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    await repo.saveChore(familyId, {
      id: (form.get("id") as string) || undefined,
      title: str(form, "title", { max: 80 }),
      description: str(form, "description", { max: 300, required: false }),
      icon: str(form, "icon", { max: 8, required: false }) || "⭐",
      amountCents: int(form, "xp", 1, 100000),
      frequency: frequency(form),
      childIds: form.getAll("childIds").map(String),
      active: form.get("active") === "on",
    });
    return "Quest saved.";
  });
  refresh();
  return result;
}

export async function deleteChore(id: string): Promise<ActionResult> {
  const result = await guard(async () => {
    await repo.deleteChore(await assertParent(), id);
    return "Quest deleted.";
  });
  refresh();
  return result;
}

/** Pay out cash (money out) or add a bonus (money in). */
export async function moveMoney(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    const kind = form.get("kind") === "payout" ? "payout" : "bonus";
    const amountCents = cents(form, "amount", 1, 1_000_000);
    await repo.addTransaction(familyId, {
      childId: str(form, "childId"),
      kind,
      amountCents,
      note: str(form, "note", { max: 120, required: false }) || null,
    });
    return kind === "payout" ? `Paid out ${money(amountCents)}.` : `Added ${money(amountCents)}.`;
  });
  refresh();
  return result;
}

export async function saveChild(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    await repo.saveChild(familyId, {
      id: (form.get("id") as string) || undefined,
      name: str(form, "name", { max: 40 }),
      creature: creature(form),
      color: color(form),
    });
    return "Trainer saved.";
  });
  refresh();
  return result;
}

export async function deleteChild(id: string): Promise<ActionResult> {
  const result = await guard(async () => {
    await repo.deleteChild(await assertParent(), id);
    return "Trainer removed.";
  });
  refresh();
  return result;
}

export async function changePin(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const familyId = await assertParent();
    const current = await repo.getPinHash(familyId);
    if (current && !verifySecret(String(form.get("current") ?? ""), current)) throw new Error("Current PIN is wrong.");
    const next = pin(form, "next");
    if (next !== String(form.get("confirm") ?? "")) throw new Error("New PINs don't match.");
    await repo.setPinHash(familyId, hashSecret(next));
    return "PIN updated.";
  });
}

export async function resetDemo(): Promise<ActionResult> {
  const result = await guard(async () => {
    await assertParent();
    if (dataMode !== "demo") throw new Error("Only available in demo mode.");
    await demoReset();
    return "Demo data restored.";
  });
  refresh();
  return result;
}
