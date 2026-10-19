import "server-only";
import { supabaseServer } from "../supabase/server";
import type { Child, Chore, Completion, Family, Reward, XpEvent } from "../types";
import { DuplicateSubmissionError, type Repo } from "./repo";

/* Row <-> model mapping (snake_case in Postgres, camelCase in the app). */

type Row = Record<string, unknown>;

const toChild = (r: Row): Child => ({
  id: r.id as string,
  familyId: r.family_id as string,
  name: r.name as string,
  creature: r.creature as Child["creature"],
  color: r.color as string,
  createdAt: r.created_at as string,
});

const toChore = (r: Row): Chore => ({
  id: r.id as string,
  familyId: r.family_id as string,
  title: r.title as string,
  description: r.description as string,
  icon: r.icon as string,
  xp: r.xp as number,
  frequency: r.frequency as Chore["frequency"],
  childIds: (r.child_ids as string[]) ?? [],
  active: r.active as boolean,
  createdAt: r.created_at as string,
});

const toCompletion = (r: Row): Completion => ({
  id: r.id as string,
  familyId: r.family_id as string,
  choreId: (r.chore_id as string) ?? "",
  childId: r.child_id as string,
  periodKey: r.period_key as string,
  status: r.status as Completion["status"],
  choreTitle: r.chore_title as string,
  choreIcon: r.chore_icon as string,
  xp: r.xp as number,
  submittedAt: r.submitted_at as string,
  reviewedAt: (r.reviewed_at as string) ?? null,
  note: (r.note as string) ?? null,
});

const toReward = (r: Row): Reward => ({
  id: r.id as string,
  familyId: r.family_id as string,
  childId: r.child_id as string,
  title: r.title as string,
  description: r.description as string,
  imageUrl: r.image_url as string,
  xpCost: r.xp_cost as number,
  sortOrder: r.sort_order as number,
  status: r.status as Reward["status"],
  unlockedAt: (r.unlocked_at as string) ?? null,
  revealedAt: (r.revealed_at as string) ?? null,
  deliveredAt: (r.delivered_at as string) ?? null,
  createdAt: r.created_at as string,
});

const toXp = (r: Row): XpEvent => ({
  id: r.id as string,
  familyId: r.family_id as string,
  childId: r.child_id as string,
  amount: r.amount as number,
  reason: r.reason as XpEvent["reason"],
  refId: r.ref_id as string,
  createdAt: r.created_at as string,
});

/** Throws on error. Data is only null for maybeSingle() misses and writes without select(). */
function check<T>(res: { data: T; error: { message: string; code?: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

export const supabaseRepo: Repo = {
  async getFamily(familyId) {
    const db = await supabaseServer();
    const row = (await db.from("families").select("id,name,timezone").eq("id", familyId).maybeSingle()).data;
    return row ? ({ id: row.id, name: row.name, timezone: row.timezone } as Family) : null;
  },
  async getPinHash(familyId) {
    const db = await supabaseServer();
    // Errors must throw: a null here means "no PIN yet" and lets the caller set one.
    const res = await db.from("families").select("pin_hash").eq("id", familyId).maybeSingle();
    if (res.error || !res.data) throw new Error(res.error?.message ?? "Family not found");
    return (res.data.pin_hash as string | null) ?? null;
  },
  async setPinHash(familyId, hash) {
    const db = await supabaseServer();
    check(await db.from("families").update({ pin_hash: hash }).eq("id", familyId));
  },

  async listChildren(familyId) {
    const db = await supabaseServer();
    return check(await db.from("children").select("*").eq("family_id", familyId).order("created_at")).map(toChild);
  },
  async saveChild(familyId, input) {
    const db = await supabaseServer();
    const fields = { family_id: familyId, name: input.name, creature: input.creature, color: input.color };
    const q = input.id ? db.from("children").update(fields).eq("id", input.id) : db.from("children").insert(fields);
    return toChild(check(await q.select().single()));
  },
  async deleteChild(familyId, childId) {
    const db = await supabaseServer();
    const chores = check(await db.from("chores").select("id,child_ids").eq("family_id", familyId).contains("child_ids", [childId]));
    for (const c of chores) {
      check(await db.from("chores").update({ child_ids: (c.child_ids as string[]).filter((id) => id !== childId) }).eq("id", c.id));
    }
    check(await db.from("children").delete().eq("id", childId).eq("family_id", familyId));
  },

  async listChores(familyId) {
    const db = await supabaseServer();
    return check(await db.from("chores").select("*").eq("family_id", familyId).order("created_at")).map(toChore);
  },
  async saveChore(familyId, input) {
    const db = await supabaseServer();
    const fields = {
      family_id: familyId,
      title: input.title,
      description: input.description,
      icon: input.icon,
      xp: input.xp,
      frequency: input.frequency,
      child_ids: input.childIds,
      active: input.active,
    };
    const q = input.id ? db.from("chores").update(fields).eq("id", input.id) : db.from("chores").insert(fields);
    return toChore(check(await q.select().single()));
  },
  async deleteChore(familyId, choreId) {
    const db = await supabaseServer();
    check(await db.from("completions").delete().eq("chore_id", choreId).eq("status", "pending"));
    check(await db.from("chores").delete().eq("id", choreId).eq("family_id", familyId));
  },

  async listCompletions(familyId) {
    const db = await supabaseServer();
    return check(await db.from("completions").select("*").eq("family_id", familyId).order("submitted_at", { ascending: false }).limit(2000)).map(toCompletion);
  },
  async submitCompletion(familyId, input) {
    const db = await supabaseServer();
    const res = await db
      .from("completions")
      .insert({
        family_id: familyId,
        chore_id: input.choreId,
        child_id: input.childId,
        period_key: input.periodKey,
        chore_title: input.choreTitle,
        chore_icon: input.choreIcon,
        xp: input.xp,
        submitted_at: input.submittedAt,
      })
      .select()
      .single();
    if (res.error?.code === "23505") throw new DuplicateSubmissionError();
    return toCompletion(check(res));
  },
  async reviewCompletion(familyId, completionId, approve, note) {
    const db = await supabaseServer();
    const unlocked = check(await db.rpc("review_completion", { p_completion: completionId, p_approve: approve, p_note: note })) as Row[];
    const row = check(await db.from("completions").select("*").eq("id", completionId).eq("family_id", familyId).single());
    return { completion: toCompletion(row), unlocked: (unlocked ?? []).map(toReward) };
  },

  async listRewards(familyId) {
    const db = await supabaseServer();
    return check(await db.from("rewards").select("*").eq("family_id", familyId).order("sort_order")).map(toReward);
  },
  async saveReward(familyId, input) {
    const db = await supabaseServer();
    if (input.id) {
      const existing = check(await db.from("rewards").select("status").eq("id", input.id).single());
      if (existing.status !== "locked") {
        check(await db.rpc("edit_unlocked_reward", { p_reward: input.id, p_title: input.title, p_description: input.description, p_image_url: input.imageUrl }));
        return toReward(check(await db.from("rewards").select("*").eq("id", input.id).single()));
      }
    }
    const fields = {
      family_id: familyId,
      child_id: input.childId,
      title: input.title,
      description: input.description,
      image_url: input.imageUrl,
      xp_cost: input.xpCost,
      sort_order: input.sortOrder,
    };
    const q = input.id ? db.from("rewards").update(fields).eq("id", input.id) : db.from("rewards").insert(fields);
    return toReward(check(await q.select().single()));
  },
  async deleteReward(familyId, rewardId) {
    const db = await supabaseServer();
    check(await db.from("rewards").delete().eq("id", rewardId).eq("family_id", familyId).eq("status", "locked"));
  },
  async settleRewards(_familyId, childId) {
    const db = await supabaseServer();
    return ((check(await db.rpc("settle_rewards", { p_child: childId })) as Row[]) ?? []).map(toReward);
  },
  async markRewardRevealed(_familyId, rewardId) {
    const db = await supabaseServer();
    check(await db.rpc("set_reward_flags", { p_reward: rewardId, p_revealed: true }));
  },
  async markRewardDelivered(_familyId, rewardId, delivered) {
    const db = await supabaseServer();
    check(await db.rpc("set_reward_flags", { p_reward: rewardId, p_delivered: delivered }));
  },

  async listXpEvents(familyId) {
    const db = await supabaseServer();
    return check(await db.from("xp_events").select("*").eq("family_id", familyId)).map(toXp);
  },
};
