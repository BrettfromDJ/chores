import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { activeGoal } from "../game";
import type { Repo } from "./repo";
import { DuplicateSubmissionError } from "./repo";
import { buildSeed, type DemoDb } from "./seed";
import type { Reward } from "../types";

/**
 * Demo storage: a single JSON file persisted to disk (.data/ locally, the OS
 * temp dir on read-only hosts). All writes are serialized through one queue so
 * concurrent server actions cannot interleave read-modify-write cycles.
 */

const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

// Kept on globalThis so every bundle layer (and dev hot reloads) shares one copy.
const store = globalThis as unknown as { __pqDemo?: { filePath: string | null; cache: DemoDb | null; queue: Promise<unknown> } };
const state = (store.__pqDemo ??= { filePath: null, cache: null, queue: Promise.resolve() });

async function resolvePath() {
  if (state.filePath) return state.filePath;
  const local = path.join(process.cwd(), ".data");
  try {
    await fs.mkdir(local, { recursive: true });
    await fs.access(local, fs.constants.W_OK);
    state.filePath = path.join(local, "pokequest.json");
  } catch {
    state.filePath = path.join(os.tmpdir(), "pokequest.json");
  }
  return state.filePath;
}

async function load(): Promise<DemoDb> {
  if (state.cache) return state.cache;
  const file = await resolvePath();
  try {
    state.cache = JSON.parse(await fs.readFile(file, "utf8")) as DemoDb;
  } catch {
    state.cache = buildSeed(TIMEZONE);
    await persist(state.cache);
  }
  return state.cache;
}

async function persist(db: DemoDb) {
  const file = await resolvePath();
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, file);
}

function read<T>(fn: (db: DemoDb) => T): Promise<T> {
  return load().then((db) => structuredClone(fn(db)));
}

function write<T>(fn: (db: DemoDb) => T): Promise<T> {
  const run = state.queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await persist(db);
    return structuredClone(result);
  });
  state.queue = run.catch(() => undefined);
  return run;
}

function notFound(what: string): never {
  throw new Error(`${what} not found`);
}

const now = () => new Date().toISOString();

function settle(db: DemoDb, familyId: string, childId: string): Reward[] {
  const unlocked: Reward[] = [];
  const balance = () => db.xpEvents.filter((e) => e.childId === childId).reduce((s, e) => s + e.amount, 0);
  for (;;) {
    const goal = activeGoal(db.rewards.filter((r) => r.familyId === familyId), childId);
    if (!goal || balance() < goal.xpCost) break;
    const reward = db.rewards.find((r) => r.id === goal.id)!;
    reward.status = "unlocked";
    reward.unlockedAt = now();
    db.xpEvents.push({ id: randomUUID(), familyId, childId, amount: -reward.xpCost, reason: "reward", refId: reward.id, createdAt: now() });
    unlocked.push(reward);
  }
  return unlocked;
}

export const demoRepo: Repo = {
  getFamily: (familyId) =>
    read((db) => {
      const f = db.families.find((f) => f.id === familyId);
      return f ? { id: f.id, name: f.name, timezone: f.timezone } : null;
    }),
  getPinHash: (familyId) => read((db) => db.families.find((f) => f.id === familyId)?.pinHash ?? null),
  setPinHash: (familyId, hash) =>
    write((db) => {
      const f = db.families.find((f) => f.id === familyId) ?? notFound("Family");
      f.pinHash = hash;
    }),

  listChildren: (familyId) => read((db) => db.children.filter((c) => c.familyId === familyId)),
  saveChild: (familyId, input) =>
    write((db) => {
      if (input.id) {
        const child = db.children.find((c) => c.id === input.id && c.familyId === familyId) ?? notFound("Child");
        Object.assign(child, { name: input.name, creature: input.creature, color: input.color });
        return child;
      }
      const child = { id: randomUUID(), familyId, name: input.name, creature: input.creature, color: input.color, createdAt: now() };
      db.children.push(child);
      return child;
    }),
  deleteChild: (familyId, childId) =>
    write((db) => {
      const owned = (x: { familyId: string; childId?: string }) => !(x.familyId === familyId && x.childId === childId);
      db.children = db.children.filter((c) => !(c.familyId === familyId && c.id === childId));
      db.completions = db.completions.filter(owned);
      db.rewards = db.rewards.filter(owned);
      db.xpEvents = db.xpEvents.filter(owned);
      for (const chore of db.chores) if (chore.familyId === familyId) chore.childIds = chore.childIds.filter((id) => id !== childId);
    }),

  listChores: (familyId) => read((db) => db.chores.filter((c) => c.familyId === familyId)),
  saveChore: (familyId, input) =>
    write((db) => {
      const kids = new Set(db.children.filter((c) => c.familyId === familyId).map((c) => c.id));
      const fields = {
        title: input.title,
        description: input.description,
        icon: input.icon,
        xp: input.xp,
        frequency: input.frequency,
        childIds: input.childIds.filter((id) => kids.has(id)),
        active: input.active,
      };
      if (input.id) {
        const chore = db.chores.find((c) => c.id === input.id && c.familyId === familyId) ?? notFound("Chore");
        Object.assign(chore, fields);
        return chore;
      }
      const chore = { id: randomUUID(), familyId, createdAt: now(), ...fields };
      db.chores.push(chore);
      return chore;
    }),
  deleteChore: (familyId, choreId) =>
    write((db) => {
      db.chores = db.chores.filter((c) => !(c.familyId === familyId && c.id === choreId));
      // Drop pending turn-ins for a deleted quest; reviewed history keeps its snapshot.
      db.completions = db.completions.filter((c) => !(c.familyId === familyId && c.choreId === choreId && c.status === "pending"));
    }),

  listCompletions: (familyId) => read((db) => db.completions.filter((c) => c.familyId === familyId)),
  submitCompletion: (familyId, input) =>
    write((db) => {
      const dup = db.completions.some(
        (c) => c.familyId === familyId && c.childId === input.childId && c.choreId === input.choreId && c.periodKey === input.periodKey && c.status !== "rejected",
      );
      if (dup) throw new DuplicateSubmissionError();
      const completion = { ...input, familyId, id: randomUUID(), status: "pending" as const, reviewedAt: null, note: null };
      db.completions.push(completion);
      return completion;
    }),
  reviewCompletion: (familyId, completionId, approve, note) =>
    write((db) => {
      const completion = db.completions.find((c) => c.id === completionId && c.familyId === familyId) ?? notFound("Completion");
      if (completion.status !== "pending") throw new Error("This quest was already reviewed.");
      completion.status = approve ? "approved" : "rejected";
      completion.reviewedAt = now();
      completion.note = note;
      let unlocked: Reward[] = [];
      if (approve) {
        db.xpEvents.push({ id: randomUUID(), familyId, childId: completion.childId, amount: completion.xp, reason: "chore", refId: completion.id, createdAt: now() });
        unlocked = settle(db, familyId, completion.childId);
      }
      return { completion, unlocked };
    }),

  listRewards: (familyId) => read((db) => db.rewards.filter((r) => r.familyId === familyId)),
  saveReward: (familyId, input) =>
    write((db) => {
      if (!db.children.some((c) => c.id === input.childId && c.familyId === familyId)) notFound("Child");
      const fields = {
        childId: input.childId,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        xpCost: input.xpCost,
        sortOrder: input.sortOrder,
      };
      if (input.id) {
        const reward = db.rewards.find((r) => r.id === input.id && r.familyId === familyId) ?? notFound("Reward");
        // Cost and owner are frozen once unlocked: the XP has already been spent.
        if (reward.status !== "locked") Object.assign(reward, { title: fields.title, description: fields.description, imageUrl: fields.imageUrl });
        else Object.assign(reward, fields);
        return reward;
      }
      const reward: Reward = { id: randomUUID(), familyId, status: "locked", unlockedAt: null, revealedAt: null, deliveredAt: null, createdAt: now(), ...fields };
      db.rewards.push(reward);
      return reward;
    }),
  deleteReward: (familyId, rewardId) =>
    write((db) => {
      const reward = db.rewards.find((r) => r.id === rewardId && r.familyId === familyId);
      if (!reward) return;
      if (reward.status !== "locked") throw new Error("Unlocked rewards stay in the trophy case and can't be deleted.");
      db.rewards = db.rewards.filter((r) => r.id !== rewardId);
    }),
  settleRewards: (familyId, childId) => write((db) => settle(db, familyId, childId)),
  markRewardRevealed: (familyId, rewardId) =>
    write((db) => {
      const reward = db.rewards.find((r) => r.id === rewardId && r.familyId === familyId);
      if (reward && reward.status !== "locked" && !reward.revealedAt) reward.revealedAt = now();
    }),
  markRewardDelivered: (familyId, rewardId, delivered) =>
    write((db) => {
      const reward = db.rewards.find((r) => r.id === rewardId && r.familyId === familyId) ?? notFound("Reward");
      if (reward.status === "locked") throw new Error("This reward hasn't been unlocked yet.");
      reward.status = delivered ? "delivered" : "unlocked";
      reward.deliveredAt = delivered ? now() : null;
    }),

  listXpEvents: (familyId) => read((db) => db.xpEvents.filter((e) => e.familyId === familyId)),
};

export async function demoFindUser(email: string) {
  return read((db) => db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null);
}

export async function demoReset() {
  await write((db) => {
    Object.assign(db, buildSeed(TIMEZONE));
  });
}
