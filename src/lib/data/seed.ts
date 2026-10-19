import "server-only";
import { randomUUID } from "node:crypto";
import { hashSecret } from "../auth/password";
import { periodKey } from "../game";
import type { Child, Chore, Completion, Family, Reward, XpEvent } from "../types";

export const DEMO_EMAIL = "parent@pokequest.demo";
export const DEMO_PASSWORD = "trainer123";
export const DEMO_PIN = "1234";

export interface DemoUser {
  email: string;
  passwordHash: string;
  familyId: string;
}

export interface DemoDb {
  version: 1;
  users: DemoUser[];
  families: (Family & { pinHash: string | null })[];
  children: Child[];
  chores: Chore[];
  completions: Completion[];
  rewards: Reward[];
  xpEvents: XpEvent[];
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

  const chore = (id: string, title: string, icon: string, xp: number, frequency: Chore["frequency"], childIds: string[], description = ""): Chore => ({
    id,
    familyId,
    title,
    description,
    icon,
    xp,
    frequency,
    childIds,
    active: true,
    createdAt: iso(daysAgo(30)),
  });

  const chores: Chore[] = [
    chore("ch_bed", "Make your bed", "🛏️", 10, "daily", both, "Pillows fluffed, blanket flat."),
    chore("ch_teeth", "Brush teeth (AM + PM)", "🪥", 5, "daily", both, "Two minutes, twice a day."),
    chore("ch_pet", "Feed Biscuit", "🐶", 15, "daily", [mia.id], "Food bowl + fresh water."),
    chore("ch_toys", "Tidy up toys", "🧸", 10, "daily", [leo.id], "Everything back in its bin."),
    chore("ch_read", "Read for 20 minutes", "📚", 20, "daily", both),
    chore("ch_dishes", "Help with dishes", "🍽️", 15, "daily", [mia.id], "Clear the table and load the dishwasher."),
    chore("ch_laundry", "Put away laundry", "👕", 40, "weekly", both, "Fold and put away your clean clothes."),
    chore("ch_room", "Deep-clean bedroom", "🧹", 60, "weekly", both, "Floor clear, dust shelves, empty the bin."),
    chore("ch_plants", "Water the plants", "🪴", 30, "weekly", [leo.id]),
    chore("ch_trash", "Take out recycling", "♻️", 35, "weekly", [mia.id]),
  ];

  const completions: Completion[] = [];
  const xpEvents: XpEvent[] = [];
  const add = (child: Child, c: Chore, when: Date, status: Completion["status"]) => {
    const id = randomUUID();
    completions.push({
      id,
      familyId,
      choreId: c.id,
      childId: child.id,
      periodKey: periodKey(c.frequency, when, timezone),
      status,
      choreTitle: c.title,
      choreIcon: c.icon,
      xp: c.xp,
      submittedAt: iso(when),
      reviewedAt: status === "pending" ? null : iso(new Date(when.getTime() + 3600_000)),
      note: status === "rejected" ? "Almost! Let's try again tomorrow." : null,
    });
    if (status === "approved") {
      xpEvents.push({ id: randomUUID(), familyId, childId: child.id, amount: c.xp, reason: "chore", refId: id, createdAt: iso(new Date(when.getTime() + 3600_000)) });
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
  // Today, waiting on a parent.
  add(mia, byId("ch_bed"), daysAgo(0, 8), "pending");
  add(mia, byId("ch_pet"), daysAgo(0, 9), "pending");

  // Leo: getting started.
  for (const d of [5, 3, 2, 1]) {
    add(leo, byId("ch_bed"), daysAgo(d, 8), "approved");
    add(leo, byId("ch_toys"), daysAgo(d, 18), "approved");
  }
  add(leo, byId("ch_plants"), daysAgo(9), "approved");
  add(leo, byId("ch_read"), daysAgo(0, 16), "pending");

  const reward = (id: string, child: Child, title: string, description: string, imageUrl: string, xpCost: number, sortOrder: number): Reward => ({
    id,
    familyId,
    childId: child.id,
    title,
    description,
    imageUrl,
    xpCost,
    sortOrder,
    status: "locked",
    unlockedAt: null,
    revealedAt: null,
    deliveredAt: null,
    createdAt: iso(daysAgo(20)),
  });

  const rewards: Reward[] = [
    reward("rw_mia_1", mia, "Booster Pack", "One shiny 10-card booster pack.", "art:embercub", 150, 1),
    reward("rw_mia_2", mia, "Holo Dragon Card", "The sparkly dragon card from the hobby shop.", "art:zapwing", 300, 2),
    reward("rw_mia_3", mia, "Collector Tin", "A tin with 4 packs and a promo card.", "art:wispurr", 600, 3),
    reward("rw_leo_1", leo, "Starter Deck", "A ready-to-play water deck.", "art:splashkit", 200, 1),
    reward("rw_leo_2", leo, "Sleeves + Binder", "Keep your collection safe.", "art:pebblit", 350, 2),
  ];

  // Mia's balance already covers the first goal: unlock it (unrevealed) so the
  // reveal animation plays the first time her dashboard is opened.
  const miaEarned = xpEvents.filter((e) => e.childId === mia.id).reduce((s, e) => s + e.amount, 0);
  if (miaEarned >= rewards[0].xpCost) {
    rewards[0].status = "unlocked";
    rewards[0].unlockedAt = iso(daysAgo(1, 20));
    xpEvents.push({ id: randomUUID(), familyId, childId: mia.id, amount: -rewards[0].xpCost, reason: "reward", refId: rewards[0].id, createdAt: rewards[0].unlockedAt });
  }

  return {
    version: 1,
    users: [{ email: DEMO_EMAIL, passwordHash: hashSecret(DEMO_PASSWORD), familyId }],
    families: [{ id: familyId, name: "The Rivera Family", timezone, pinHash: hashSecret(DEMO_PIN) }],
    children: [mia, leo],
    chores,
    completions,
    rewards,
    xpEvents,
  };
}
