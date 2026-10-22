import Link from "next/link";
import { Mascot } from "./Mascot";

/* ---------- Icons (glossy, original) ---------- */

export function GemIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#0d6b5a" />
      <path d="M7 9l2.5-3h5L17 9l-5 9z" fill="url(#gem-g)" stroke="#0b4d40" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9.5 6L12 9l2.5-3M7 9h10M12 9v9" stroke="#0b4d40" strokeWidth=".8" fill="none" opacity=".6" />
      <path d="M9 7.2l1.2 1.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

export function CoinIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#8a4b00" />
      <circle cx="12" cy="11.5" r="9" fill="url(#coin-g)" />
      <text x="12" y="15.6" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8a4b00" fontFamily="system-ui">
        XP
      </text>
    </svg>
  );
}

export function CashIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#0b5a33" />
      <rect x="4.5" y="7.5" width="15" height="9" rx="1.8" fill="#5ef08f" stroke="#0b5a33" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="2.6" fill="#18b24b" />
      <text x="12" y="13.9" textAnchor="middle" fontSize="5" fontWeight="900" fill="#eafff1" fontFamily="system-ui">
        $
      </text>
      <path d="M6 9.2h2M16 14.8h2" stroke="#0b5a33" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function FlameIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#8a1f3a" />
      <path d="M12 3.5c3 3 5.5 5.6 5.5 9a5.5 5.5 0 01-11 0c0-2 1-3.4 2.2-4.4.1 1.4.8 2.4 1.8 2.8C10 8.6 10.6 5.6 12 3.5z" fill="url(#flame-g)" />
      <path d="M12 12c1.4 1.3 2.3 2.4 2.3 3.6a2.3 2.3 0 01-4.6 0c0-1.2.9-2.3 2.3-3.6z" fill="#fff4b0" />
    </svg>
  );
}

export function TrophyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M7 3h10v6a5 5 0 01-10 0z" fill="#ffcf3a" stroke="#8a4b00" strokeWidth="1.5" />
      <path d="M7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3" fill="none" stroke="#8a4b00" strokeWidth="1.5" />
      <path d="M10 14h4v3h-4zM7.5 20h9v-2a1 1 0 00-1-1h-7a1 1 0 00-1 1z" fill="#ffcf3a" stroke="#8a4b00" strokeWidth="1.5" />
      <path d="M9 5v3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function LockIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7.5 10V7.5a4.5 4.5 0 019 0V10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="11" rx="3" fill="#fff" />
      <circle cx="12" cy="15" r="1.7" fill="#8c95cf" />
    </svg>
  );
}

/* ---------- Bars ---------- */

/** Rounded glossy progress bar with an optional centered label. */
export function GameBar({
  value,
  max,
  label,
  from = "#55a8ff",
  to = "#2f6bff",
  className = "",
  height = "h-6",
  ariaLabel,
}: {
  value: number;
  max: number;
  label?: React.ReactNode;
  from?: string;
  to?: string;
  className?: string;
  height?: string;
  ariaLabel?: string;
}) {
  const pct = max <= 0 ? 100 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={`relative overflow-hidden rounded-full border-2 border-night bg-night/90 ${height} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[400ms] ease-out"
        style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${from}, ${to})`, boxShadow: "inset 0 2px 0 rgba(255,255,255,.45)" }}
      />
      {label && (
        <span className="text-game absolute inset-0 flex items-center justify-center gap-1 text-[13px] leading-none" style={{ textShadow: "0 1.5px 0 #14124a" }}>
          {label}
        </span>
      )}
    </div>
  );
}

/** Hexagon level badge + bar, like a trophy level meter. */
export function LevelMeter({ level, value, max, caption = "Trainer level" }: { level: number; value: number; max: number; caption?: string }) {
  return (
    <div className="flex items-center gap-0">
      <span className="relative z-10 -mr-3 flex h-11 w-10 shrink-0 items-center justify-center">
        <svg viewBox="0 0 40 44" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M20 2l17 10v20L20 42 3 32V12z" fill="#2f4fe0" stroke="#14124a" strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 7l12 7v4H8v-4z" fill="#fff" opacity=".18" />
        </svg>
        <span className="text-game relative text-lg">{level}</span>
      </span>
      <div className="flex-1">
        <p className="text-game mb-0.5 pl-5 text-[13px]">{caption}</p>
        <GameBar
          value={value}
          max={max}
          height="h-6"
          ariaLabel={caption}
          label={
            <>
              <TrophyIcon size={14} /> {value}/{max}
            </>
          }
        />
      </div>
    </div>
  );
}

/* ---------- Layout bits ---------- */

export function BackButton({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className="btn-game btn-lilac !h-11 !w-11 !rounded-xl !p-0">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path d="M15 4l-8 8 8 8" fill="none" stroke="#2f22b0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

const ARROWS = [
  { left: "8%", size: 26, delay: "0s" },
  { left: "22%", size: 16, delay: ".6s" },
  { left: "78%", size: 30, delay: ".3s" },
  { left: "88%", size: 18, delay: "1s" },
  { left: "34%", size: 14, delay: "1.2s" },
  { left: "66%", size: 20, delay: ".8s" },
];

/** Hero stage: content over a pink glow with rising arrows and sparkles. */
export function GlowStage({ className = "", children, arrows = true }: { className?: string; children: React.ReactNode; arrows?: boolean }) {
  return (
    <div className={`relative flex items-end justify-center ${className}`}>
      {/* Outer div centers; inner div pulses (an animated transform would override the centering). */}
      <div className="pointer-events-none absolute left-1/2 top-[55%] aspect-square w-[130%] max-w-[520px] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <div
          className="h-full w-full animate-glow-breathe rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,79,216,.8) 0%, rgba(214,72,255,.5) 28%, rgba(120,70,255,0) 62%)" }}
        />
      </div>
      <svg viewBox="0 0 100 60" className="pointer-events-none absolute left-1/2 top-[2%] w-[115%] max-w-[480px] -translate-x-1/2 opacity-70" aria-hidden>
        <path d="M50 2L96 58H4z" fill="url(#stage-tri)" />
      </svg>
      {arrows && ARROWS.map((a, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width={a.size}
          height={a.size}
          className="pointer-events-none absolute bottom-[18%] animate-rise"
          style={{ left: a.left, animationDelay: a.delay, filter: "drop-shadow(0 0 6px rgba(255,120,240,.9))" }}
          aria-hidden
        >
          <path d="M10 1l8 9h-5v9H7v-9H2z" fill="#fff" />
        </svg>
      ))}
      {[12, 30, 70, 85, 50].map((x, i) => (
        <span
          key={x}
          className="pointer-events-none absolute h-1.5 w-1.5 animate-twinkle rounded-full bg-white"
          style={{ left: `${x}%`, top: `${15 + ((i * 23) % 50)}%`, animationDelay: `${i * 0.3}s` }}
          aria-hidden
        />
      ))}
      {children}
    </div>
  );
}

export function Stage({ creature, size = 200, className = "" }: { creature: string; size?: number; className?: string }) {
  return (
    <GlowStage className={className}>
      <Mascot creature={creature} size={size} className="relative animate-bob drop-shadow-[0_10px_20px_rgba(20,18,74,.45)]" />
    </GlowStage>
  );
}
