import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Repo } from "./repo";
import { DuplicateSubmissionError } from "./repo";
import { buildSeed, DEMO_DB_VERSION, type DemoDb } from "./seed";

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
    const parsed = JSON.parse(await fs.readFile(file, "utf8")) as DemoDb;
    if (parsed.version !== DEMO_DB_VERSION) throw new Error("outdated demo data");
    state.cache = parsed;
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

function balanceOf(db: DemoDb, childId: string) {
  return db.transactions.filter((t) => t.childId === childId).reduce((s, t) => s + t.amountCents, 0);
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
      db.transactions = db.transactions.filter(owned);
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
        amountCents: input.amountCents,
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
      if (approve) {
        db.transactions.push({ id: randomUUID(), familyId, childId: completion.childId, amountCents: completion.amountCents, kind: "earned", refId: completion.id, note: null, createdAt: now() });
      }
      return completion;
    }),

  listTransactions: (familyId) => read((db) => db.transactions.filter((t) => t.familyId === familyId)),
  addTransaction: (familyId, input) =>
    write((db) => {
      if (!db.children.some((c) => c.id === input.childId && c.familyId === familyId)) notFound("Child");
      if (!(input.amountCents > 0)) throw new Error("Amount must be more than zero.");
      if (input.kind === "payout" && balanceOf(db, input.childId) < input.amountCents) throw new Error("That's more than what's in the wallet.");
      const tx = {
        id: randomUUID(),
        familyId,
        childId: input.childId,
        amountCents: input.kind === "payout" ? -input.amountCents : input.amountCents,
        kind: input.kind,
        refId: null,
        note: input.note,
        createdAt: now(),
      };
      db.transactions.push(tx);
      return tx;
    }),
};
export async function demoFindUser(email: string) {
  return read((db) => db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null);
}

export async function demoReset() {
  await write((db) => {
    Object.assign(db, buildSeed(TIMEZONE));
  });
}
