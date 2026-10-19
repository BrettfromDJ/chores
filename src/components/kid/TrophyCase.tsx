"use client";

import { useState } from "react";
import { CardArt } from "@/components/CardArt";
import { RewardUnlock } from "./RewardUnlock";
import type { Reward } from "@/lib/types";

type Item = Pick<Reward, "id" | "title" | "description" | "imageUrl" | "xpCost" | "status">;

export function TrophyCase({ childId, kidName, rewards }: { childId: string; kidName: string; rewards: Item[] }) {
  const [replay, setReplay] = useState<Item | null>(null);
  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rewards.map((r) => (
          <li key={r.id}>
            <button onClick={() => setReplay(r)} className="block w-full text-left transition-transform active:scale-95 sm:hover:-rotate-2" aria-label={`Replay ${r.title}`}>
              <CardArt imageUrl={r.imageUrl} title={r.title} holo />
            </button>
            <p className="mt-2 truncate text-center text-sm font-extrabold">{r.title}</p>
            <p className={`mt-0.5 text-center font-pixel text-[8px] uppercase ${r.status === "delivered" ? "text-leaf-dark" : "text-sun-dark"}`}>
              {r.status === "delivered" ? "✓ In your binder" : "★ Ready to claim"}
            </p>
          </li>
        ))}
      </ul>
      {replay && <RewardUnlock key={replay.id} childId={childId} reward={replay} kidName={kidName} replay onClose={() => setReplay(null)} />}
    </>
  );
}
