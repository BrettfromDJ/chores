"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import { DuplicateSubmissionError } from "@/lib/data/repo";
import { requireFamily } from "@/lib/auth/session";
import { periodKey } from "@/lib/game";
import { guard, type ActionResult } from "@/lib/validate";

const TZ = process.env.APP_TIMEZONE || "America/New_York";

/**
 * A child turns in a quest. This only records a *pending* completion: money is
 * never paid here, only when a parent approves on the server.
 * The pay is read from the server-side chore, never from the client.
 */
export async function turnInQuest(childId: string, choreId: string): Promise<ActionResult> {
  const familyId = await requireFamily();
  const result = await guard(async () => {
    const [family, children, chores] = await Promise.all([repo.getFamily(familyId), repo.listChildren(familyId), repo.listChores(familyId)]);
    const child = children.find((c) => c.id === childId);
    const chore = chores.find((c) => c.id === choreId);
    if (!child || !chore || !chore.active || !chore.childIds.includes(child.id)) throw new Error("That quest isn't on your board.");
    const now = new Date();
    try {
      await repo.submitCompletion(familyId, {
        familyId,
        choreId: chore.id,
        childId: child.id,
        periodKey: periodKey(chore.frequency, now, family?.timezone || TZ),
        choreTitle: chore.title,
        choreIcon: chore.icon,
        amountCents: chore.amountCents,
        submittedAt: now.toISOString(),
      });
    } catch (e) {
      if (e instanceof DuplicateSubmissionError) return "Already turned in!";
      throw e;
    }
    return "Sent to your parent for approval!";
  });
  revalidatePath(`/kid/${childId}`, "layout");
  revalidatePath("/parent", "layout");
  return result;
}
