/** Original capsule design for reward reveals (two halves so it can burst open). */
export function QuestOrb({ color = "#ffcc33", size = 140, split = false }: { color?: string; size?: number; split?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="pixelated overflow-visible" aria-hidden>
      <g className={split ? "orb-top" : ""}>
        <path d="M10 2h12v2h4v2h2v4h2v5H2v-5h2V6h2V4h4z" fill="#1d1a2f" />
        <path d="M10 4h12v2h4v4h2v4H4v-4h2V6h4z" fill={color} />
        <path d="M10 6h4v2h-4zM8 8h2v2H8z" fill="#fff" opacity=".8" />
        <path d="M21 7h2v1h1v2h-1v1h-2v-1h-1V8h1z" fill="#fff" opacity=".5" />
      </g>
      <g className={split ? "orb-bottom" : ""}>
        <path d="M2 17h28v5h-2v4h-2v2h-4v2H10v-2H6v-2H4v-4H2z" fill="#1d1a2f" />
        <path d="M4 18h24v4h-2v4h-4v2H10v-2H6v-4H4z" fill="#fff8e8" />
        <path d="M6 22h2v2H6zM24 22h2v2h-2z" fill="#efe0bf" />
      </g>
      {!split && (
        <g>
          <path d="M0 14h32v4H0z" fill="#1d1a2f" />
          <path d="M16 11l5 5-5 5-5-5z" fill="#1d1a2f" />
          <path d="M16 13l3 3-3 3-3-3z" fill="#8a5cf6" />
          <path d="M16 13l1 1-1 1-1-1z" fill="#fff" />
        </g>
      )}
    </svg>
  );
}
