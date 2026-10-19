"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRevealed } from "@/app/actions/kid";
import { CardArt } from "@/components/CardArt";
import { QuestOrb } from "./QuestOrb";
import type { Reward } from "@/lib/types";

type Stage = "drop" | "shake" | "burst" | "reveal";

const CONFETTI_COLORS = ["#ffcf3a", "#ff4fd8", "#3ee8ff", "#3ee07a", "#9f7dff", "#ffffff"];

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
          size: 7 + Math.round(Math.random() * 4) * 2,
          round: i % 3 === 0,
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-white"
      style={{ background: "radial-gradient(circle at 50% 45%, #5a3df0 0%, #2a1f9e 55%, #120f45 100%)" }}
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
          style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,95,224,.2) 0deg 10deg, transparent 10deg 24deg)" }}
        />
      </div>

      <p key={revealed ? "r" : stage} className={`text-game relative mb-4 text-center ${revealed ? "type-in text-4xl text-gold" : "animate-pulse text-2xl"}`}>
        {revealed ? "Reward Unlocked!" : stage === "drop" ? "Whoa…" : "The Quest Egg is hatching!"}
      </p>

      <div className="relative flex h-[340px] w-full max-w-[240px] items-center justify-center">
        {!revealed && (
          <div className={stage === "drop" ? "orb-drop" : stage === "shake" ? "orb-shake" : ""}>
            <QuestOrb split={stage === "burst"} />
          </div>
        )}

        {revealed && (
          <>
            <div className="absolute h-80 w-80 animate-glow-breathe rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,79,216,.85), rgba(255,207,58,.35) 50%, transparent 70%)" }} aria-hidden />
            {confetti.map((c, i) => (
              <span
                key={i}
                className="confetti absolute left-1/2 top-1/2"
                style={
                  {
                    width: c.size,
                    height: c.size,
                    background: c.color,
                    borderRadius: c.round ? "999px" : "3px",
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
        <p className="text-game text-3xl leading-tight">{reward.title}</p>
        <p className="mt-2 text-[16px] font-bold text-white/80">
          Amazing work, {kidName}! {replay ? "This one's in your trophy case." : "Show this to your parent to claim your reward."}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          disabled={!revealed || pending}
          className="btn-game btn-green mt-6 !px-12 !py-4 !text-2xl"
        >
          {pending ? "Saving…" : "Awesome!"}
        </button>
      </div>
    </div>
  );
}
