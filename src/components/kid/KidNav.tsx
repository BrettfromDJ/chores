"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Quests", icon: "⚔️" },
  { href: "/rewards", label: "Rewards", icon: "🎁" },
  { href: "/journal", label: "Journal", icon: "📖" },
];

export function KidNav({ childId }: { childId: string }) {
  const path = usePathname();
  const base = `/kid/${childId}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-ink bg-paper pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-3 sm:max-w-2xl">
        {TABS.map((t) => {
          const href = base + t.href;
          const active = path === href;
          return (
            <li key={t.label}>
              <Link href={href} className="flex flex-col items-center gap-1.5 py-3" aria-current={active ? "page" : undefined}>
                <span className={`text-xl transition-transform ${active ? "-translate-y-0.5 scale-110" : "opacity-60 grayscale"}`}>{t.icon}</span>
                <span className={`font-pixel text-[8px] uppercase ${active ? "text-ink" : "text-ink-mute"}`}>
                  {active && <span className="mr-1 inline-block animate-blink">▶</span>}
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
