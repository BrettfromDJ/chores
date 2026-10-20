"use client";

import { useEffect, useMemo, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { CashIcon } from "@/components/game";
import { money } from "@/lib/money";

const COLORS = ["#ffcf3a", "#ff4fd8", "#3ee8ff", "#3ee07a", "#9f7dff", "#ffffff"];

/**
 * Celebrates the kid's latest level-up bonus once per device. "Seen" is a
 * per-device convenience only; the bonus itself is already in the wallet.
 */
export function LevelUp({ txId, level, amount, creature, kidName }: { txId: string; level: number; amount: number; creature: string; kidName: string }) {
  const key = `pq-levelup-seen-${txId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(key)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [key]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const angle = (i / 40) * Math.PI * 2;
        const dist = 150 + ((i * 37) % 140);
        return { dx: `${Math.cos(angle) * dist}px`, dy: `${Math.sin(angle) * dist}px`, rot: `${(i * 83) % 720}deg`, size: 7 + (i % 4) * 2, color: COLORS[i % COLORS.length], round: i % 3 === 0, delay: (i % 5) * 0.04 };
      }),
    [],
  );

  const close = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-white"
      style={{ background: "radial-gradient(circle at 50% 45%, #5a3df0 0%, #2a1f9e 55%, #120f45 100%)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Level up! Level ${level}`}
    >
      <div className="absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <div className="h-full w-full animate-spin-slow" style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,207,58,.16) 0deg 10deg, transparent 10deg 24deg)" }} />
      </div>

      <p className="text-game level-in relative text-5xl text-gold">Level Up!</p>

      <div className="relative mt-6 flex h-64 w-64 items-center justify-center">
        <div className="absolute h-72 w-72 animate-glow-breathe rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,79,216,.8), rgba(255,207,58,.35) 50%, transparent 70%)" }} aria-hidden />
        {confetti.map((c, i) => (
          <span
            key={i}
            className="confetti absolute left-1/2 top-1/2"
            style={{ width: c.size, height: c.size, background: c.color, borderRadius: c.round ? 999 : 3, animationDelay: `${c.delay}s`, ["--dx"]: c.dx, ["--dy"]: c.dy, ["--rot"]: c.rot } as React.CSSProperties}
            aria-hidden
          />
        ))}
        <Mascot creature={creature} size={190} className="relative animate-bob drop-shadow-[0_10px_20px_rgba(20,18,74,.5)]" />
        <span className="level-in absolute -right-2 top-2 flex h-20 w-[72px] items-center justify-center [animation-delay:.25s]">
          <svg viewBox="0 0 40 44" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M20 2l17 10v20L20 42 3 32V12z" fill="#2f4fe0" stroke="#14124a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M20 7l12 7v4H8v-4z" fill="#fff" opacity=".18" />
          </svg>
          <span className="text-game relative text-3xl">{level}</span>
        </span>
      </div>

      <div className="relative mt-4 max-w-xs text-center">
        <p className="text-game text-2xl">You reached level {level}, {kidName}!</p>
        <p className="level-in mx-auto mt-4 flex w-fit items-center gap-2 rounded-2xl border-2 border-mint/70 bg-mint/20 px-4 py-2 font-display text-2xl text-mint [animation-delay:.5s]">
          <CashIcon size={30} /> +{money(amount)} bonus
        </p>
        <p className="mt-2 font-bold text-white/75">Added to your wallet. Keep questing!</p>
        <button onClick={close} className="btn-game btn-green mt-6 !px-12 !py-4 !text-2xl">
          Awesome!
        </button>
      </div>
    </div>
  );
}
