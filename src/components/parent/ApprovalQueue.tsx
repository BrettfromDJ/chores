"use client";

import { useState, useTransition } from "react";
import { approveAll, reviewQuest } from "@/app/actions/parent";
import { Mascot } from "@/components/Mascot";
import { Flash } from "./Flash";
import type { ActionResult } from "@/lib/validate";
import { money } from "@/lib/money";

export interface QueueItem {
  id: string;
  childName: string;
  creature: string;
  color: string;
  icon: string;
  title: string;
  amountCents: number;
  submittedAt: string;
  frequency: "daily" | "weekly";
}

export function ApprovalQueue({ items }: { items: QueueItem[] }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();

  const run = (key: string, fn: () => Promise<ActionResult>) => {
    setBusy(key);
    startTransition(async () => {
      setResult(await fn());
      setBusy(null);
      setRejecting(null);
      setNote("");
    });
  };

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-10 text-center">
        <Mascot creature="sproutle" size={56} className="animate-bob" />
        <p className="mt-3 font-semibold">All caught up</p>
        <p className="text-sm text-slate-500">New turn-ins from your kids will show up here.</p>
        <Flash result={result} />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-indigo-50 px-4 py-3">
        <p className="text-sm font-semibold">
          Waiting for approval <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{items.length}</span>
        </p>
        {items.length > 1 && (
          <button className="btn-ghost !py-1.5" disabled={busy !== null} onClick={() => run("all", () => approveAll(items.map((i) => i.id)))}>
            {busy === "all" ? "Approving…" : "Approve all"}
          </button>
        )}
      </div>
      <ul className="divide-y divide-indigo-50">
        {items.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${item.color}1a` }}>
                {item.icon}
                <span className="absolute -bottom-1 -right-1 rounded-md bg-white p-0.5 shadow-sm ring-1 ring-indigo-100">
                  <Mascot creature={item.creature} size={16} />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{item.title}</p>
                <p className="text-xs text-slate-500" suppressHydrationWarning>
                  {item.childName} · {item.frequency} · {timeAgo(item.submittedAt)}
                </p>
              </div>
              <span className="hidden text-right text-sm font-semibold leading-tight text-emerald-600 sm:block">
                +{item.amountCents} XP
                <span className="block text-xs font-medium text-slate-500">{money(item.amountCents)}</span>
              </span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  className="btn-ghost !px-2.5"
                  aria-label={`Send back ${item.title}`}
                  disabled={busy !== null}
                  onClick={() => setRejecting(rejecting === item.id ? null : item.id)}
                >
                  ✕
                </button>
                <button className="btn bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy !== null} onClick={() => run(item.id, () => reviewQuest(item.id, true))}>
                  {busy === item.id ? "…" : <>✓ <span className="sm:hidden">{money(item.amountCents)}</span><span className="hidden sm:inline">Approve</span></>}
                </button>
              </div>
            </div>
            {rejecting === item.id && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(item.id, () => reviewQuest(item.id, false, note));
                }}
              >
                <input className="field !py-2 text-sm" placeholder="Optional note, e.g. “Almost — finish the bed corners!”" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} autoFocus />
                <button className="btn-danger shrink-0" disabled={busy !== null}>
                  Send back
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <Flash result={result} />
    </div>
  );
}

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
