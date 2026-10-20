import { money, xp } from "./money";
import type { Child, ChildStats, Chore, Completion, Frequency, Transaction } from "./types";

/* ---------- Levels ---------- */

const TITLES = ["Rookie", "Saver", "Hustler", "Go-Getter", "Money Pro", "Tycoon", "Mogul", "Legend"];

/** Lifetime XP needed to reach a level: L2=500 ($5), L3=1,500 ($15), L4=3,000, L5=5,000… */
export function centsForLevel(level: number) {
  return 250 * level * (level - 1);
}

export function levelFromCents(cents: number) {
  let level = 1;
  while (centsForLevel(level + 1) <= cents) level++;
  return level;
}

/** Paid automatically each time a kid reaches a new level: 100 XP = $1. Keep in sync with supabase/schema.sql. */
export const LEVEL_UP_BONUS = 100;

/** XP that counts toward levels: quests and parent bonuses, never level-up bonuses (so they can't cascade). */
export function lifetimeEarned(transactions: Transaction[], childId: string) {
  return transactions.filter((t) => t.childId === childId && (t.kind === "earned" || t.kind === "bonus")).reduce((s, t) => s + t.amountCents, 0);
}

/** Levels the kid has reached but hasn't been paid for yet (levels never go down). */
export function unpaidLevels(transactions: Transaction[], childId: string) {
  const paid = transactions.filter((t) => t.childId === childId && t.kind === "level_up").length;
  const level = levelFromCents(lifetimeEarned(transactions, childId));
  const missing: number[] = [];
  for (let n = paid + 2; n <= level; n++) missing.push(n);
  return missing;
}

export function levelTitle(level: number) {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))];
}

/** Balance is the sum of the ledger; lifetime counts money earned from quests and bonuses. */
export function computeStats(childId: string, transactions: Transaction[], completions: Completion[], timezone: string): ChildStats {
  const mine = transactions.filter((t) => t.childId === childId);
  const lifetimeCents = lifetimeEarned(transactions, childId);
  const balanceCents = mine.reduce((s, t) => s + t.amountCents, 0);
  const level = levelFromCents(lifetimeCents);
  return {
    lifetimeCents,
    balanceCents,
    level,
    levelTitle: levelTitle(level),
    levelFloor: centsForLevel(level),
    levelCeil: centsForLevel(level + 1),
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

/* ---------- Badges ---------- */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number; // 0..1
}

export function computeBadges(stats: ChildStats, approved: Completion[], transactions: Transaction[]): Badge[] {
  const weekly = approved.filter((c) => c.periodKey.includes("W")).length;
  const cashOuts = transactions.filter((t) => t.kind === "payout").length;
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
    make("first", "First Paycheck", "Get XP for your first quest", "💵", approved.length, 1),
    make("ten", "Hard Worker", "Finish 10 quests", "🛠️", approved.length, 10),
    make("streak3", "On a Roll", "3-day quest streak", "🔥", stats.streak, 3),
    make("streak7", "Unstoppable", "7-day quest streak", "⚡", stats.streak, 7),
    make("earn10", "Ten Spot", `Earn ${xp(1000)} (${money(1000, { compact: true })})`, "💰", stats.lifetimeCents, 1000),
    make("earn50", "Big Earner", `Earn ${xp(5000)} (${money(5000, { compact: true })})`, "🤑", stats.lifetimeCents, 5000),
    make("saver", "Super Saver", `Save up ${xp(2000)} (${money(2000, { compact: true })})`, "🐷", stats.balanceCents, 2000),
    make("payday", "Payday", "Cash out with a parent", "🏦", cashOuts, 1),
    make("weekly5", "Weekly Warrior", "Finish 5 weekly quests", "🛡️", weekly, 5),
    make("variety", "Jack of All Trades", "Complete 5 different quests", "🎒", kinds, 5),
  ];
}
