import type { Child, ChildStats, Chore, Completion, Frequency, Reward, XpEvent } from "./types";

/* ---------- Levels ---------- */

const TITLES = ["Rookie", "Explorer", "Pathfinder", "Ace Trainer", "Veteran", "Champion", "Legend", "Mythic"];

/** Total lifetime XP needed to reach a level: L1=0, L2=50, L3=150, L4=300, L5=500… */
export function xpForLevel(level: number) {
  return 25 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelTitle(level: number) {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))];
}

export function computeStats(childId: string, events: XpEvent[], completions: Completion[], timezone: string): ChildStats {
  const mine = events.filter((e) => e.childId === childId);
  const lifetimeXp = mine.filter((e) => e.reason === "chore").reduce((s, e) => s + e.amount, 0);
  const balance = mine.reduce((s, e) => s + e.amount, 0);
  const level = levelFromXp(lifetimeXp);
  return {
    lifetimeXp,
    balance,
    level,
    levelTitle: levelTitle(level),
    levelFloor: xpForLevel(level),
    levelCeil: xpForLevel(level + 1),
    streak: computeStreak(completions.filter((c) => c.childId === childId && c.status === "approved"), timezone),
  };
}

/* ---------- Periods (daily / weekly resets in the household timezone) ---------- */

export function localDate(date: Date, timezone: string) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function isoWeekKey(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function periodKey(frequency: Frequency, now: Date, timezone: string) {
  const ymd = localDate(now, timezone);
  return frequency === "daily" ? ymd : isoWeekKey(ymd);
}

function shiftYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with at least one approved quest. */
export function computeStreak(approved: Completion[], timezone: string, now = new Date()) {
  const days = new Set(approved.map((c) => localDate(new Date(c.submittedAt), timezone)));
  let cursor = localDate(now, timezone);
  if (!days.has(cursor)) cursor = shiftYmd(cursor, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = shiftYmd(cursor, -1);
  }
  return streak;
}

/* ---------- Quest board ---------- */

export interface QuestItem {
  chore: Chore;
  completion: Completion | null;
}

export function questBoard(child: Child, chores: Chore[], completions: Completion[], timezone: string, now = new Date()) {
  const keys = { daily: periodKey("daily", now, timezone), weekly: periodKey("weekly", now, timezone) };
  const mine = chores.filter((c) => c.active && c.childIds.includes(child.id));
  const find = (chore: Chore) =>
    completions
      .filter((c) => c.childId === child.id && c.choreId === chore.id && c.periodKey === keys[chore.frequency] && c.status !== "rejected")
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ?? null;
  const toItem = (chore: Chore): QuestItem => ({ chore, completion: find(chore) });
  return {
    daily: mine.filter((c) => c.frequency === "daily").map(toItem),
    weekly: mine.filter((c) => c.frequency === "weekly").map(toItem),
  };
}

export function activeGoal(rewards: Reward[], childId: string) {
  return rewards.filter((r) => r.childId === childId && r.status === "locked").sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}

/* ---------- Badges ---------- */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number; // 0..1
}

export function computeBadges(stats: ChildStats, approved: Completion[], rewards: Reward[]): Badge[] {
  const weekly = approved.filter((c) => c.periodKey.includes("W")).length;
  const unlocked = rewards.filter((r) => r.status !== "locked").length;
  const kinds = new Set(approved.map((c) => c.choreId)).size;
  const make = (id: string, name: string, description: string, icon: string, value: number, goal: number): Badge => ({
    id,
    name,
    description,
    icon,
    earned: value >= goal,
    progress: Math.min(1, value / goal),
  });
  return [
    make("first", "First Steps", "Finish your very first quest", "👟", approved.length, 1),
    make("ten", "Quest Hunter", "Finish 10 quests", "🗡️", approved.length, 10),
    make("streak3", "On a Roll", "3-day quest streak", "🔥", stats.streak, 3),
    make("streak7", "Unstoppable", "7-day quest streak", "⚡", stats.streak, 7),
    make("xp100", "Century", "Earn 100 lifetime XP", "💯", stats.lifetimeXp, 100),
    make("xp500", "Power Surge", "Earn 500 lifetime XP", "🌟", stats.lifetimeXp, 500),
    make("weekly5", "Weekly Warrior", "Finish 5 weekly quests", "🛡️", weekly, 5),
    make("variety", "Jack of All Trades", "Complete 5 different quests", "🎒", kinds, 5),
    make("reward1", "Collector", "Unlock your first reward", "🎁", unlocked, 1),
    make("reward3", "Grand Collector", "Unlock 3 rewards", "👑", unlocked, 3),
  ];
}
