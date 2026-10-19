/**
 * Original "Quest Egg" used for reward reveals. Two halves split along a
 * zigzag crack so it can burst open.
 */
export function QuestOrb({ size = 150, split = false }: { size?: number; split?: boolean }) {
  return (
    <svg viewBox="0 0 120 140" width={size} height={size * 1.17} className="overflow-visible drop-shadow-[0_12px_20px_rgba(10,8,60,.5)]" aria-hidden>
      <defs>
        <linearGradient id="egg-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9be9" />
          <stop offset="1" stopColor="#c62aa2" />
        </linearGradient>
        <linearGradient id="egg-bot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="1" stopColor="#ffc94a" />
        </linearGradient>
      </defs>
      <g className={split ? "orb-top" : ""}>
        <path d="M14 70 C14 30 36 4 60 4 C84 4 106 30 106 70 L96 62 L86 72 L76 62 L66 72 L56 62 L46 72 L36 62 L26 72 Z" fill="url(#egg-top)" stroke="#14124a" strokeWidth="5" strokeLinejoin="round" />
        <ellipse cx="42" cy="28" rx="12" ry="7" transform="rotate(-35 42 28)" fill="#fff" opacity=".55" />
        <circle cx="76" cy="30" r="7" fill="#fff" opacity=".35" />
        <circle cx="56" cy="50" r="5" fill="#fff" opacity=".3" />
        <circle cx="88" cy="52" r="4" fill="#fff" opacity=".3" />
      </g>
      <g className={split ? "orb-bottom" : ""}>
        <path d="M14 70 L26 72 L36 62 L46 72 L56 62 L66 72 L76 62 L86 72 L96 62 L106 70 C106 110 86 136 60 136 C34 136 14 110 14 70 Z" fill="url(#egg-bot)" stroke="#14124a" strokeWidth="5" strokeLinejoin="round" />
        <path d="M60 92 l5 10 11 1.5 -8 7.5 2 11 -10 -5.5 -10 5.5 2 -11 -8 -7.5 11 -1.5z" fill="#ff7a3d" stroke="#14124a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M28 100 q6 22 30 30" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".5" />
      </g>
    </svg>
  );
}
