"use client";

import { usePathname } from "next/navigation";
import { BackButton, CashIcon, CoinIcon, FlameIcon } from "@/components/game";
import { money } from "@/lib/money";

const TITLES: Record<string, string> = { "": "Quest Board", wallet: "My Wallet", journal: "Journal" };

export function KidTopBar({ childId, balance, streak }: { childId: string; balance: number; streak: number }) {
  const path = usePathname();
  const tab = path.replace(`/kid/${childId}`, "").replace(/^\//, "");
  return (
    <header className="relative z-20 pt-[env(safe-area-inset-top)]">
      {/* dark diagonal corner, like a game menu header */}
      <div className="pointer-events-none absolute left-0 top-0 h-24 w-72 bg-night/70 [clip-path:polygon(0_0,100%_0,0_100%)] lg:w-[28rem]" aria-hidden />
      <div className="relative mx-auto flex max-w-lg items-center gap-2 px-4 py-3 lg:max-w-6xl">
        <BackButton href="/" label="Switch trainer" />
        <h1 className="text-game min-w-0 flex-1 truncate text-2xl max-sm:sr-only">{TITLES[tab] ?? "Quest Board"}</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="pill" title="XP in your wallet">
            <CoinIcon /> {balance.toLocaleString("en-US")}
          </span>
          <span className="pill" title="What your XP is worth (100 XP = $1)">
            <CashIcon /> {money(balance)}
          </span>
          <span className="pill max-sm:hidden" title="Day streak">
            <FlameIcon /> {streak}
          </span>
        </div>
      </div>
    </header>
  );
}
