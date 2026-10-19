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
          <li key={r.id} className="relative">
            <button onClick={() => setReplay(r)} className="block w-full transition-transform active:scale-95 lg:hover:-rotate-2" aria-label={`Replay ${r.title}`}>
              <CardArt imageUrl={r.imageUrl} title={r.title} holo />
            </button>
            {r.status !== "delivered" && <span className="badge-new">Claim!</span>}
            <p className={`mt-2 text-center font-display text-sm ${r.status === "delivered" ? "text-mint" : "text-gold"}`}>
              {r.status === "delivered" ? "✓ In your binder" : "Ask a parent!"}
            </p>
          </li>
        ))}
      </ul>
      {replay && <RewardUnlock key={replay.id} childId={childId} reward={replay} kidName={kidName} replay onClose={() => setReplay(null)} />}
    </>
  );
}
