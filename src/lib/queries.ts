import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { repo } from "./data";
import { activeGoal, computeBadges, computeStats, questBoard } from "./game";

const DEFAULT_TZ = process.env.APP_TIMEZONE || "America/New_York";

export const loadFamily = cache(async (familyId: string) => {
  const [family, children, chores, completions, rewards, xpEvents] = await Promise.all([
    repo.getFamily(familyId),
    repo.listChildren(familyId),
    repo.listChores(familyId),
    repo.listCompletions(familyId),
    repo.listRewards(familyId),
    repo.listXpEvents(familyId),
  ]);
  const timezone = family?.timezone || DEFAULT_TZ;
  const stats = Object.fromEntries(children.map((c) => [c.id, computeStats(c.id, xpEvents, completions, timezone)]));
  return { family, timezone, children, chores, completions, rewards, xpEvents, stats };
});

export type FamilyData = Awaited<ReturnType<typeof loadFamily>>;

export const loadChild = cache(async (familyId: string, childId: string) => {
  const data = await loadFamily(familyId);
  const child = data.children.find((c) => c.id === childId);
  if (!child) notFound();
  const stats = data.stats[child.id];
  const rewards = data.rewards.filter((r) => r.childId === child.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const completions = data.completions.filter((c) => c.childId === child.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const approved = completions.filter((c) => c.status === "approved");
  return {
    ...data,
    child,
    stats,
    board: questBoard(child, data.chores, data.completions, data.timezone),
    goal: activeGoal(rewards, child.id),
    childRewards: rewards,
    history: completions,
    badges: computeBadges(stats, approved, rewards),
    unrevealed: rewards.find((r) => r.status !== "locked" && !r.revealedAt) ?? null,
  };
});

export type ChildData = Awaited<ReturnType<typeof loadChild>>;
