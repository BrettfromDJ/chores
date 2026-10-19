"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import { demoReset } from "@/lib/data/demo";
import { dataMode } from "@/lib/data";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { assertParent } from "@/lib/auth/session";
import { color, creature, frequency, guard, imageUrl, int, pin, str, type ActionResult } from "@/lib/validate";

/* Every action here re-checks the parent PIN cookie on the server. */

function refresh() {
  revalidatePath("/", "layout");
}

export async function reviewQuest(completionId: string, approve: boolean, note?: string): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    const clean = note?.trim().slice(0, 200) || null;
    const { completion, unlocked } = await repo.reviewCompletion(familyId, completionId, approve, clean);
    if (!approve) return "Sent back for another try.";
    const extra = unlocked.length ? ` 🎉 Unlocked: ${unlocked.map((r) => r.title).join(", ")}!` : "";
    return `+${completion.xp} XP awarded.${extra}`;
  });
  refresh();
  return result;
}

export async function approveAll(completionIds: string[]): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    let xp = 0;
    const unlocked: string[] = [];
    for (const id of completionIds.slice(0, 100)) {
      const r = await repo.reviewCompletion(familyId, id, true, null);
      xp += r.completion.xp;
      unlocked.push(...r.unlocked.map((u) => u.title));
    }
    return `Approved ${completionIds.length} quests (+${xp} XP).${unlocked.length ? ` 🎉 Unlocked: ${unlocked.join(", ")}!` : ""}`;
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
      xp: int(form, "xp", 1, 1000),
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

export async function saveReward(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const result = await guard(async () => {
    const familyId = await assertParent();
    const childId = str(form, "childId");
    await repo.saveReward(familyId, {
      id: (form.get("id") as string) || undefined,
      childId,
      title: str(form, "title", { max: 80 }),
      description: str(form, "description", { max: 300, required: false }),
      imageUrl: imageUrl(form),
      xpCost: int(form, "xpCost", 1, 100000),
      sortOrder: int(form, "sortOrder", 0, 1000),
    });
    const unlocked = await repo.settleRewards(familyId, childId);
    return unlocked.length ? `Saved — and it's already unlocked! 🎉` : "Reward saved.";
  });
  refresh();
  return result;
}

export async function deleteReward(id: string): Promise<ActionResult> {
  const result = await guard(async () => {
    await repo.deleteReward(await assertParent(), id);
    return "Reward deleted.";
  });
  refresh();
  return result;
}

export async function setDelivered(id: string, delivered: boolean): Promise<ActionResult> {
  const result = await guard(async () => {
    await repo.markRewardDelivered(await assertParent(), id, delivered);
    return delivered ? "Marked as handed over." : "Marked as not yet handed over.";
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
