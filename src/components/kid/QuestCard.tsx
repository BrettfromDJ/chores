"use client";

import { useOptimistic, useState, useTransition } from "react";
import { turnInQuest } from "@/app/actions/kid";
import { CoinIcon } from "@/components/game";
import type { CompletionStatus } from "@/lib/types";

interface Props {
  childId: string;
  chore: { id: string; title: string; description: string; icon: string; xp: number };
  status: CompletionStatus | null;
}

export function QuestCard({ childId, chore, status }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [burst, setBurst] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const turnIn = () => {
    setError(null);
    setBurst((b) => b + 1);
    if (navigator.vibrate) navigator.vibrate(18);
    startTransition(async () => {
      setOptimistic("pending");
      const res = await turnInQuest(childId, chore.id);
      if (!res.ok) setError(res.message ?? "Try again!");
    });
  };

  const done = optimistic === "approved";
  const waiting = optimistic === "pending";

  return (
    <div className={`panel-row relative flex items-center gap-3 p-2.5 transition-colors ${done ? "!bg-mint/15" : ""}`}>
      <span
        key={burst}
        className={`slot h-14 w-14 shrink-0 text-[28px] ${burst ? "animate-wiggle" : ""}`}
        style={done ? { background: "linear-gradient(180deg,#5ef08f,#18b24b)", borderColor: "#a8ffc6" } : waiting ? { background: "linear-gradient(180deg,#ffe066,#f5b400)", borderColor: "#fff1a8" } : undefined}
        aria-hidden
      >
        {chore.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-display text-[17px] leading-tight ${done ? "text-white/60 line-through decoration-2" : "text-white"}`}>{chore.title}</p>
        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-night/60 py-0.5 pl-0.5 pr-2 font-display text-[13px] text-gold">
          <CoinIcon size={16} /> +{chore.xp} XP
        </p>
        {error && <p className="mt-1 text-xs font-bold text-pink-300">{error}</p>}
      </div>

      <div className="relative shrink-0">
        {done ? (
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-night bg-mint text-xl text-white shadow-[0_3px_0_#14124a]" aria-label="Approved">
            ✓
          </span>
        ) : waiting ? (
          <span className="flex flex-col items-center px-1 font-display text-[13px] leading-tight text-gold" aria-label="Waiting for approval">
            <span className="animate-pulse text-xl leading-none">⏳</span>
            Waiting
          </span>
        ) : (
          <button onClick={turnIn} disabled={pending} className="btn-game btn-green !px-4 !py-2.5 !text-[17px]">
            Done!
          </button>
        )}
        {burst > 0 && waiting && (
          <span key={burst} className="text-game pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 animate-float whitespace-nowrap text-sm text-gold">
            ★ Sent!
          </span>
        )}
      </div>
    </div>
  );
}
