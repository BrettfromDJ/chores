export type Frequency = "daily" | "weekly";
export type CompletionStatus = "pending" | "approved" | "rejected";

export type CreatureId = "embercub" | "sproutle" | "splashkit" | "zapwing" | "pebblit" | "wispurr";

/** All money is stored as integer cents. */
export type Cents = number;

export interface Family {
  id: string;
  name: string;
  timezone: string;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  creature: CreatureId;
  color: string;
  createdAt: string;
}

export interface Chore {
  id: string;
  familyId: string;
  title: string;
  description: string;
  icon: string;
  /** What the quest pays when a parent approves it. */
  amountCents: Cents;
  frequency: Frequency;
  childIds: string[];
  active: boolean;
  createdAt: string;
}

export interface Completion {
  id: string;
  familyId: string;
  choreId: string;
  childId: string;
  /** "2026-10-19" for daily quests, "2026-W43" for weekly quests */
  periodKey: string;
  status: CompletionStatus;
  /** Snapshot of chore title/pay at submission time so history survives edits. */
  choreTitle: string;
  choreIcon: string;
  amountCents: Cents;
  submittedAt: string;
  reviewedAt: string | null;
  note: string | null;
}

export type TransactionKind = "earned" | "bonus" | "payout";

/** Wallet ledger. Only the server writes here; balance = sum(amountCents). */
export interface Transaction {
  id: string;
  familyId: string;
  childId: string;
  /** Positive for money in, negative for money out. */
  amountCents: Cents;
  kind: TransactionKind;
  /** Completion id for "earned". */
  refId: string | null;
  note: string | null;
  createdAt: string;
}

export interface ChildStats {
  lifetimeCents: Cents;
  balanceCents: Cents;
  level: number;
  levelTitle: string;
  levelFloor: Cents;
  levelCeil: Cents;
  streak: number;
}
