import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { repo } from "./data";
import { computeBadges, computeStats, questBoard } from "./game";

const DEFAULT_TZ = process.env.APP_TIMEZONE || "America/New_York";

export const loadFamily = cache(async (familyId: string) => {
  const [family, children, chores, completions, transactions] = await Promise.all([
    repo.getFamily(familyId),
    repo.listChildren(familyId),
    repo.listChores(familyId),
    repo.listCompletions(familyId),
    repo.listTransactions(familyId),
  ]);
  const timezone = family?.timezone || DEFAULT_TZ;
  const stats = Object.fromEntries(children.map((c) => [c.id, computeStats(c.id, transactions, completions, timezone)]));
  return { family, timezone, children, chores, completions, transactions, stats };
});

export type FamilyData = Awaited<ReturnType<typeof loadFamily>>;

export const loadChild = cache(async (familyId: string, childId: string) => {
  const data = await loadFamily(familyId);
  const child = data.children.find((c) => c.id === childId);
  if (!child) notFound();
  const stats = data.stats[child.id];
  const completions = data.completions.filter((c) => c.childId === child.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const approved = completions.filter((c) => c.status === "approved");
  const ledger = data.transactions.filter((t) => t.childId === child.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    ...data,
    child,
    stats,
    board: questBoard(child, data.chores, data.completions, data.timezone),
    history: completions,
    ledger,
    badges: computeBadges(stats, approved, ledger),
  };
});

export type ChildData = Awaited<ReturnType<typeof loadChild>>;
