import type { Child, Chore, Completion, Family, Reward, XpEvent } from "../types";

export type NewCompletion = Omit<Completion, "id" | "status" | "reviewedAt" | "note">;
export type ChildInput = Pick<Child, "name" | "creature" | "color"> & { id?: string };
export type ChoreInput = Pick<Chore, "title" | "description" | "icon" | "xp" | "frequency" | "childIds" | "active"> & { id?: string };
export type RewardInput = Pick<Reward, "childId" | "title" | "description" | "imageUrl" | "xpCost" | "sortOrder"> & { id?: string };

export interface ReviewResult {
  completion: Completion;
  unlocked: Reward[];
}

/**
 * Storage boundary. Every method is scoped to a family id that the caller has
 * already authenticated. Implementations: demo (JSON file) and Supabase (RLS + RPC).
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
  /** Atomically review, award XP and unlock any rewards the new balance covers. */
  reviewCompletion(familyId: string, completionId: string, approve: boolean, note: string | null): Promise<ReviewResult>;

  listRewards(familyId: string): Promise<Reward[]>;
  saveReward(familyId: string, input: RewardInput): Promise<Reward>;
  deleteReward(familyId: string, rewardId: string): Promise<void>;
  /** Unlock rewards in goal order while the child's balance covers them. */
  settleRewards(familyId: string, childId: string): Promise<Reward[]>;
  markRewardRevealed(familyId: string, rewardId: string): Promise<void>;
  markRewardDelivered(familyId: string, rewardId: string, delivered: boolean): Promise<void>;

  listXpEvents(familyId: string): Promise<XpEvent[]>;
}

export class DuplicateSubmissionError extends Error {
  constructor() {
    super("This quest was already turned in for this period.");
  }
}
