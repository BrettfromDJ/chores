"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRevealed } from "@/app/actions/kid";
import { CardArt } from "@/components/CardArt";
import { QuestOrb } from "./QuestOrb";
import type { Reward } from "@/lib/types";

type Stage = "drop" | "shake" | "burst" | "reveal";

const CONFETTI_COLORS = ["#ffcc33", "#e8423f", "#3d6cf0", "#38b26b", "#8a5cf6", "#ffffff"];

/**
 * Full-screen reward reveal: capsule drops in, shakes three times, bursts open
 * and the reward card flips into view. Tap to skip ahead.
 * Pass `replay` to show it again without marking anything server-side.
 */
export function RewardUnlock({
  childId,
  reward,
  kidName,
  replay = false,
  onClose,
}: {
  childId: string;
  reward: Pick<Reward, "id" | "title" | "description" | "imageUrl" | "xpCost">;
  kidName: string;
  replay?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("drop");
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return setStage("reveal");
    const t = [setTimeout(() => setStage("shake"), 900), setTimeout(() => setStage("burst"), 2800), setTimeout(() => setStage("reveal"), 3200)];
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === "burst" && navigator.vibrate) navigator.vibrate([30, 40, 60]);
  }, [stage]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 140 + Math.random() * 160;
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          rot: `${Math.random() * 720 - 360}deg`,
          size: 6 + Math.round(Math.random() * 3) * 2,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 0.15,
        };
      }),
    [],
  );

  const close = () => {
    if (replay) {
      setOpen(false);
      onClose?.();
      return;
    }
    startTransition(async () => {
      await markRevealed(childId, reward.id);
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) return null;
  const revealed = stage === "reveal";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-ink/95 px-6 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Reward unlocked: ${reward.title}`}
      onClick={() => !revealed && setStage("reveal")}
    >
      {/* Light rays */}
      <div
        className={`absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${revealed ? "opacity-100" : "opacity-30"}`}
        aria-hidden
      >
        <div
          className="h-full w-full animate-spin-slow"
          style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,204,51,.16) 0deg 10deg, transparent 10deg 24deg)" }}
        />
      </div>

      <p className={`relative mb-6 font-pixel text-[11px] uppercase tracking-widest text-sun ${revealed ? "" : "animate-blink"}`}>
        {revealed ? "★ Reward unlocked ★" : stage === "drop" ? "Whoa…" : "Something's happening!"}
      </p>

      <div className="relative flex h-[340px] w-full max-w-[240px] items-center justify-center">
        {!revealed && (
          <div className={stage === "drop" ? "orb-drop" : stage === "shake" ? "orb-shake" : ""}>
            <QuestOrb split={stage === "burst"} />
          </div>
        )}

        {revealed && (
          <>
            <div className="glow-pulse absolute h-72 w-72 rounded-full bg-sun/40 blur-3xl" aria-hidden />
            {confetti.map((c, i) => (
              <span
                key={i}
                className="confetti absolute left-1/2 top-1/2"
                style={
                  {
                    width: c.size,
                    height: c.size,
                    background: c.color,
                    animationDelay: `${c.delay}s`,
                    ["--dx"]: c.dx,
                    ["--dy"]: c.dy,
                    ["--rot"]: c.rot,
                  } as React.CSSProperties
                }
                aria-hidden
              />
            ))}
            <div className="card-in relative w-full">
              <CardArt imageUrl={reward.imageUrl} title={reward.title} xpCost={reward.xpCost} holo className="w-full" />
            </div>
          </>
        )}
      </div>

      {stage === "burst" && <div className="flash pointer-events-none absolute inset-0 bg-white" aria-hidden />}

      <div className={`relative mt-8 max-w-xs text-center transition-opacity duration-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
        <p className="type-in font-pixel text-base leading-relaxed">{reward.title}</p>
        <p className="mt-3 text-[15px] font-semibold text-white/75">
          Amazing work, {kidName}! {replay ? "This one's in your trophy case." : "Show this to your parent to claim your reward."}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          disabled={!revealed || pending}
          className="pixel-btn mt-6 !px-8 !py-4"
          style={{ ["--btn" as string]: "#38b26b", ["--ink" as string]: "#ffffff" }}
        >
          {pending ? "Saving…" : "Awesome!"}
        </button>
      </div>
    </div>
  );
}
