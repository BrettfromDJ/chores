"use client";

import { useOptimistic, useState, useTransition } from "react";
import { turnInQuest } from "@/app/actions/kid";
import type { CompletionStatus } from "@/lib/types";

interface Props {
  childId: string;
  color: string;
  chore: { id: string; title: string; description: string; icon: string; xp: number };
  status: CompletionStatus | null;
}

export function QuestCard({ childId, color, chore, status }: Props) {
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
    <div className={`pixel-box relative flex items-center gap-3 p-3 transition-colors ${done ? "!bg-leaf/10" : ""}`}>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-ink text-2xl ${burst ? "animate-wiggle" : ""}`}
        key={burst}
        style={{ background: done ? "#8de0ad" : waiting ? "#ffe58a" : `${color}22` }}
        aria-hidden
      >
        {chore.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-extrabold leading-tight ${done ? "text-ink-mute line-through decoration-2" : ""}`}>{chore.title}</p>
        {chore.description && <p className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-ink-mute">{chore.description}</p>}
        {error && <p className="mt-1 text-xs font-bold text-berry">{error}</p>}
      </div>

      <div className="relative shrink-0">
        {done ? (
          <span className="flex flex-col items-center px-2 font-pixel text-[9px] text-leaf-dark">
            <span className="text-lg leading-none">✓</span>+{chore.xp}
          </span>
        ) : waiting ? (
          <span className="flex flex-col items-center gap-1 px-1 text-center font-pixel text-[7px] uppercase leading-tight text-sun-dark">
            <span className="animate-blink text-base leading-none">⏳</span>
            Waiting
          </span>
        ) : (
          <button onClick={turnIn} disabled={pending} className="pixel-btn !m-1 !px-3" style={{ ["--btn" as string]: color }}>
            +{chore.xp} XP
          </button>
        )}
        {burst > 0 && waiting && (
          <span key={burst} className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 animate-float font-pixel text-[10px] text-sun-dark">
            ★ Sent!
          </span>
        )}
      </div>
    </div>
  );
}
