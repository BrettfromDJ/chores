"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/parent", label: "Approvals" },
  { href: "/parent/quests", label: "Quests" },
  { href: "/parent/rewards", label: "Rewards" },
  { href: "/parent/trainers", label: "Kids" },
  { href: "/parent/history", label: "History" },
  { href: "/parent/settings", label: "Settings" },
];

export function AdminNav({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav className="mx-auto max-w-5xl overflow-x-auto px-2 [scrollbar-width:none]">
      <ul className="flex gap-1">
        {LINKS.map((l) => {
          const active = l.href === "/parent" ? path === l.href : path.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
              >
                {l.label}
                {l.href === "/parent" && pending > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-slate-900">{pending}</span>}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-900" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
