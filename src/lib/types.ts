export type Frequency = "daily" | "weekly";
export type CompletionStatus = "pending" | "approved" | "rejected";
export type RewardStatus = "locked" | "unlocked" | "delivered";

export type CreatureId = "embercub" | "sproutle" | "splashkit" | "zapwing" | "pebblit" | "wispurr";

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
  xp: number;
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
  /** Snapshot of chore title/xp at submission time so history survives edits. */
  choreTitle: string;
  choreIcon: string;
  xp: number;
  submittedAt: string;
  reviewedAt: string | null;
  note: string | null;
}

export interface Reward {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  description: string;
  /** http(s) URL of a photo, or "art:<creature>" for built-in card art. */
  imageUrl: string;
  xpCost: number;
  /** Lower comes first. The first locked reward is the child's active goal. */
  sortOrder: number;
  status: RewardStatus;
  unlockedAt: string | null;
  revealedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

/** Ledger of XP movement. Only the server writes here. */
export interface XpEvent {
  id: string;
  familyId: string;
  childId: string;
  amount: number;
  reason: "chore" | "reward";
  refId: string;
  createdAt: string;
}

export interface ChildStats {
  lifetimeXp: number;
  balance: number;
  level: number;
  levelTitle: string;
  levelFloor: number;
  levelCeil: number;
  streak: number;
}
