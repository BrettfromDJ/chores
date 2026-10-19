import "server-only";
import { randomUUID } from "node:crypto";
import { hashSecret } from "../auth/password";
import { periodKey } from "../game";
import type { Child, Chore, Completion, Family, Transaction } from "../types";

export const DEMO_EMAIL = "parent@pokequest.demo";
export const DEMO_PASSWORD = "trainer123";
export const DEMO_PIN = "1234";

/** Bump when the stored shape changes; older demo files are reseeded. */
export const DEMO_DB_VERSION = 4;

export interface DemoUser {
  email: string;
  passwordHash: string;
  familyId: string;
}

export interface DemoDb {
  version: typeof DEMO_DB_VERSION;
  users: DemoUser[];
  families: (Family & { pinHash: string | null })[];
  children: Child[];
  chores: Chore[];
  completions: Completion[];
  transactions: Transaction[];
}

export function buildSeed(timezone: string, now = new Date()): DemoDb {
  const familyId = "fam_demo";
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number, hour = 17) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(hour, 15, 0, 0);
    return d;
  };

  const mia: Child = { id: "kid_mia", familyId, name: "Mia", creature: "embercub", color: "#e8423f", createdAt: iso(daysAgo(30)) };
  const leo: Child = { id: "kid_leo", familyId, name: "Leo", creature: "splashkit", color: "#3d6cf0", createdAt: iso(daysAgo(30)) };
  const both = [mia.id, leo.id];

  const chore = (id: string, title: string, icon: string, amountCents: number, frequency: Chore["frequency"], childIds: string[], description = ""): Chore => ({
    id,
    familyId,
    title,
    description,
    icon,
    amountCents,
    frequency,
    childIds,
    active: true,
    createdAt: iso(daysAgo(30)),
  });

  const chores: Chore[] = [
    chore("ch_bed", "Make your bed", "🛏️", 50, "daily", both, "Pillows fluffed, blanket flat."),
    chore("ch_teeth", "Brush teeth (AM + PM)", "🪥", 25, "daily", both, "Two minutes, twice a day."),
    chore("ch_pet", "Feed Biscuit", "🐶", 75, "daily", [mia.id], "Food bowl + fresh water."),
    chore("ch_toys", "Tidy up toys", "🧸", 50, "daily", [leo.id], "Everything back in its bin."),
    chore("ch_read", "Read for 20 minutes", "📚", 100, "daily", both),
    chore("ch_dishes", "Help with dishes", "🍽️", 75, "daily", [mia.id], "Clear the table and load the dishwasher."),
    chore("ch_laundry", "Put away laundry", "👕", 200, "weekly", both, "Fold and put away your clean clothes."),
    chore("ch_room", "Deep-clean bedroom", "🧹", 300, "weekly", both, "Floor clear, dust shelves, empty the bin."),
    chore("ch_plants", "Water the plants", "🪴", 150, "weekly", [leo.id]),
    chore("ch_trash", "Take out recycling", "♻️", 150, "weekly", [mia.id]),
  ];

  const completions: Completion[] = [];
  const transactions: Transaction[] = [];
  const add = (child: Child, c: Chore, when: Date, status: Completion["status"]) => {
    const id = randomUUID();
    const reviewedAt = status === "pending" ? null : iso(new Date(when.getTime() + 3600_000));
    completions.push({
      id,
      familyId,
      choreId: c.id,
      childId: child.id,
      periodKey: periodKey(c.frequency, when, timezone),
      status,
      choreTitle: c.title,
      choreIcon: c.icon,
      amountCents: c.amountCents,
      submittedAt: iso(when),
      reviewedAt,
      note: status === "rejected" ? "Almost! Let's try again tomorrow." : null,
    });
    if (status === "approved") {
      transactions.push({ id: randomUUID(), familyId, childId: child.id, amountCents: c.amountCents, kind: "earned", refId: id, note: null, createdAt: reviewedAt! });
    }
  };
  const byId = (id: string) => chores.find((c) => c.id === id)!;

  // Mia: a strong 6-day streak.
  for (let d = 6; d >= 1; d--) {
    add(mia, byId("ch_bed"), daysAgo(d, 8), "approved");
    add(mia, byId("ch_teeth"), daysAgo(d, 20), "approved");
    if (d % 2 === 0) add(mia, byId("ch_pet"), daysAgo(d, 18), "approved");
    if (d % 3 === 0) add(mia, byId("ch_read"), daysAgo(d, 19), "approved");
  }
  add(mia, byId("ch_dishes"), daysAgo(4, 19), "rejected");
  add(mia, byId("ch_laundry"), daysAgo(8), "approved");
  add(mia, byId("ch_room"), daysAgo(9), "approved");
  add(mia, byId("ch_bed"), daysAgo(0, 8), "pending");
  add(mia, byId("ch_pet"), daysAgo(0, 9), "pending");
  transactions.push(
    { id: randomUUID(), familyId, childId: mia.id, amountCents: 500, kind: "bonus", refId: null, note: "Birthday money from Grandma 🎂", createdAt: iso(daysAgo(7, 12)) },
    { id: randomUUID(), familyId, childId: mia.id, amountCents: -300, kind: "payout", refId: null, note: "Ice cream at the park", createdAt: iso(daysAgo(3, 15)) },
  );

  // Leo: getting started.
  for (const d of [5, 3, 2, 1]) {
    add(leo, byId("ch_bed"), daysAgo(d, 8), "approved");
    add(leo, byId("ch_toys"), daysAgo(d, 18), "approved");
  }
  add(leo, byId("ch_plants"), daysAgo(9), "approved");
  add(leo, byId("ch_read"), daysAgo(0, 16), "pending");

  return {
    version: DEMO_DB_VERSION,
    users: [{ email: DEMO_EMAIL, passwordHash: hashSecret(DEMO_PASSWORD), familyId }],
    families: [{ id: familyId, name: "The Rivera Family", timezone, pinHash: hashSecret(DEMO_PIN) }],
    children: [mia, leo],
    chores,
    completions,
    transactions,
  };
}
