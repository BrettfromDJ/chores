"use client";

import { usePathname } from "next/navigation";
import { BackButton, CoinIcon, FlameIcon, GemIcon } from "@/components/game";

const TITLES: Record<string, string> = { "": "Quest Board", rewards: "Rewards", journal: "Journal" };

export function KidTopBar({ childId, balance, streak, badges }: { childId: string; balance: number; streak: number; badges: number }) {
  const path = usePathname();
  const tab = path.replace(`/kid/${childId}`, "").replace(/^\//, "");
  return (
    <header className="relative z-20 pt-[env(safe-area-inset-top)]">
      {/* dark diagonal corner, like a game menu header */}
      <div className="pointer-events-none absolute left-0 top-0 h-24 w-72 bg-night/70 [clip-path:polygon(0_0,100%_0,0_100%)] lg:w-[28rem]" aria-hidden />
      <div className="relative mx-auto flex max-w-lg items-center gap-3 px-4 py-3 lg:max-w-6xl">
        <BackButton href="/" label="Switch trainer" />
        <h1 className="text-game flex-1 truncate text-2xl">{TITLES[tab] ?? "Quest Board"}</h1>
        <div className="flex items-center gap-1.5">
          <span className="pill" title="XP to spend on rewards">
            <CoinIcon /> {balance}
          </span>
          <span className="pill" title="Day streak">
            <FlameIcon /> {streak}
          </span>
          <span className="pill max-sm:hidden" title="Badges earned">
            <GemIcon /> {badges}
          </span>
        </div>
      </div>
    </header>
  );
}
