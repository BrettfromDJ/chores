import "server-only";
import { supabaseServer } from "../supabase/server";
import type { Child, Chore, Completion, Family, Transaction } from "../types";
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
  amountCents: r.amount_cents as number,
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
  amountCents: r.amount_cents as number,
  submittedAt: r.submitted_at as string,
  reviewedAt: (r.reviewed_at as string) ?? null,
  note: (r.note as string) ?? null,
});

const toTransaction = (r: Row): Transaction => ({
  id: r.id as string,
  familyId: r.family_id as string,
  childId: r.child_id as string,
  amountCents: r.amount_cents as number,
  kind: r.kind as Transaction["kind"],
  refId: (r.ref_id as string) ?? null,
  note: (r.note as string) ?? null,
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
      amount_cents: input.amountCents,
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
        amount_cents: input.amountCents,
        submitted_at: input.submittedAt,
      })
      .select()
      .single();
    if (res.error?.code === "23505") throw new DuplicateSubmissionError();
    return toCompletion(check(res));
  },
  async reviewCompletion(familyId, completionId, approve, note) {
    const db = await supabaseServer();
    check(await db.rpc("review_completion", { p_completion: completionId, p_approve: approve, p_note: note }));
    return toCompletion(check(await db.from("completions").select("*").eq("id", completionId).eq("family_id", familyId).single()));
  },

  async listTransactions(familyId) {
    const db = await supabaseServer();
    return check(await db.from("transactions").select("*").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5000)).map(toTransaction);
  },
  async addTransaction(_familyId, input) {
    const db = await supabaseServer();
    const row = check(await db.rpc("add_transaction", { p_child: input.childId, p_kind: input.kind, p_amount: input.amountCents, p_note: input.note }));
    return toTransaction(row as Row);
  },
};
