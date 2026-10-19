import type { Child, Chore, Completion, Family, Transaction } from "../types";

export type NewCompletion = Omit<Completion, "id" | "status" | "reviewedAt" | "note">;
export type ChildInput = Pick<Child, "name" | "creature" | "color"> & { id?: string };
export type ChoreInput = Pick<Chore, "title" | "description" | "icon" | "amountCents" | "frequency" | "childIds" | "active"> & { id?: string };
export type ManualTransaction = { childId: string; kind: "bonus" | "payout"; amountCents: number; note: string | null };

/**
 * Storage boundary. Every method is scoped to a family id that the caller has
 * already authenticated. Implementations: demo (JSON file) and Supabase (RLS + RPC).
 * Wallet math (ledger writes, balance checks) happens inside the repo so each
 * change is atomic.
 */
export interface Repo {
  getFamily(familyId: string): Promise<Family | null>;
  getPinHash(familyId: string): Promise<string | null>;
  setPinHash(familyId: string, hash: string): Promise<void>;

  listChildren(familyId: string): Promise<Child[]>;
  saveChild(familyId: string, input: ChildInput): Promise<Child>;
  deleteChild(familyId: string, childId: string): Promise<void>;

  listChores(familyId: string): Promise<Chore[]>;
  saveChore(familyId: string, input: ChoreInput): Promise<Chore>;
  deleteChore(familyId: string, choreId: string): Promise<void>;

  listCompletions(familyId: string): Promise<Completion[]>;
  /** Must reject duplicates for the same chore/child/period that are not rejected. */
  submitCompletion(familyId: string, input: NewCompletion): Promise<Completion>;
  /** Atomically review and, when approved, pay the kid's wallet. */
  reviewCompletion(familyId: string, completionId: string, approve: boolean, note: string | null): Promise<Completion>;

  listTransactions(familyId: string): Promise<Transaction[]>;
  /** Bonus (money in) or payout (cash handed over). Payouts can't overdraw. */
  addTransaction(familyId: string, input: ManualTransaction): Promise<Transaction>;
}

export class DuplicateSubmissionError extends Error {
  constructor() {
    super("This quest was already turned in for this period.");
  }
}
