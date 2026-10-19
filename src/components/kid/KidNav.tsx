"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Quests", icon: "⚔️" },
  { href: "/wallet", label: "Wallet", icon: "🐷" },
  { href: "/journal", label: "Journal", icon: "📖" },
];

export function KidNav({ childId }: { childId: string }) {
  const path = usePathname();
  const base = `/kid/${childId}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
      <ul className="panel mx-auto grid max-w-lg grid-cols-3 gap-2 p-2">
        {TABS.map((t) => {
          const href = base + t.href;
          const active = path === href;
          return (
            <li key={t.label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`btn-game w-full !flex-col !gap-1 !px-2 !py-2 !text-[15px] ${active ? "btn-yellow" : "btn-navy"}`}
              >
                <span className={`text-2xl leading-none transition-transform ${active ? "scale-110" : ""}`} aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
