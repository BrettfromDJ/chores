import { CREATURES, getCreature, type Creature } from "@/lib/creatures";

/**
 * Glossy chibi-style partner creatures drawn in SVG. Gradients are defined once
 * in <MascotDefs/> (root layout) so every instance can reference them by id.
 */
export function Mascot({
  creature,
  size = 96,
  className = "",
  silhouette = false,
  title,
}: {
  creature: string;
  size?: number;
  className?: string;
  silhouette?: boolean;
  title?: string;
}) {
  const c = getCreature(creature);
  const id = c.id;
  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={className}
      role="img"
      aria-label={title ?? c.name}
      style={silhouette ? { filter: "brightness(0) saturate(100%)", opacity: 0.55 } : undefined}
    >
      <ellipse cx="100" cy="210" rx="52" ry="8" fill="rgba(10,8,60,.28)" />
      <Behind c={c} />
      {/* feet */}
      <ellipse cx="78" cy="198" rx="17" ry="11" fill={c.colors.dark} />
      <ellipse cx="122" cy="198" rx="17" ry="11" fill={c.colors.dark} />
      {/* body */}
      <ellipse cx="100" cy="162" rx="46" ry="40" fill={`url(#${id}-body)`} />
      <ellipse cx="100" cy="172" rx="27" ry="23" fill={c.colors.belly} />
      {/* arms */}
      <ellipse cx="56" cy="160" rx="12" ry="18" transform="rotate(25 56 160)" fill={c.colors.dark} />
      <ellipse cx="144" cy="160" rx="12" ry="18" transform="rotate(-25 144 160)" fill={c.colors.dark} />
      {/* head */}
      <Ears c={c} />
      <circle cx="100" cy="92" r="64" fill={`url(#${id}-head)`} />
      <ellipse cx="74" cy="56" rx="24" ry="14" transform="rotate(-25 74 56)" fill="#fff" opacity=".35" />
      <Front c={c} />
      {/* face */}
      <ellipse cx="76" cy="100" rx="10" ry="14" fill="#16123d" />
      <ellipse cx="124" cy="100" rx="10" ry="14" fill="#16123d" />
      <circle cx="72.5" cy="94" r="4" fill="#fff" />
      <circle cx="120.5" cy="94" r="4" fill="#fff" />
      <circle cx="79" cy="107" r="1.8" fill="#fff" opacity=".8" />
      <circle cx="127" cy="107" r="1.8" fill="#fff" opacity=".8" />
      <ellipse cx="60" cy="120" rx="10" ry="6" fill="#ff6f9c" opacity=".45" />
      <ellipse cx="140" cy="120" rx="10" ry="6" fill="#ff6f9c" opacity=".45" />
      <path d="M92 120 q4 5 8 0 q4 5 8 0" fill="none" stroke="#16123d" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Behind({ c }: { c: Creature }) {
  const { accentDark, base, dark } = c.colors;
  switch (c.id) {
    case "embercub":
      return <path d="M140 170 q30 -6 34 -36 q8 18 -2 34 q10 -4 14 -14 q2 26 -26 32 z" fill={`url(#${c.id}-accent)`} />;
    case "sproutle":
      return <path d="M142 176 q26 4 36 -18 q-24 -6 -36 18z" fill={accentDark} />;
    case "splashkit":
      return <path d="M142 178 q24 -2 30 -22 q4 18 -6 30 q10 2 18 -6 q-8 22 -42 10z" fill={dark} />;
    case "zapwing":
      return <path d="M140 172 l26 -10 l-8 12 l22 -6 l-30 22 l6 -10 z" fill={accentDark} />;
    case "pebblit":
      return null;
    case "wispurr":
      return <path d="M140 176 q34 6 36 -22 q2 -14 -12 -16 q10 10 0 20 q-8 8 -24 6z" fill={base} />;
  }
}

function Ears({ c }: { c: Creature }) {
  const { base, dark, accent, accentDark, light } = c.colors;
  switch (c.id) {
    case "embercub":
      return (
        <g>
          <circle cx="50" cy="46" r="22" fill={dark} />
          <circle cx="150" cy="46" r="22" fill={dark} />
          <circle cx="52" cy="48" r="12" fill={accent} />
          <circle cx="148" cy="48" r="12" fill={accent} />
        </g>
      );
    case "splashkit":
      return (
        <g>
          <path d="M44 70 q-26 -30 -10 -52 q26 8 34 40z" fill={dark} />
          <path d="M156 70 q26 -30 10 -52 q-26 8 -34 40z" fill={dark} />
          <path d="M46 62 q-14 -20 -6 -34 q14 6 20 26z" fill={accent} />
          <path d="M154 62 q14 -20 6 -34 q-14 6 -20 26z" fill={accent} />
        </g>
      );
    case "zapwing":
      return (
        <g>
          <path d="M50 64 l-26 -30 l20 4 l-14 -28 l38 36 l-18 -2 l14 22z" fill={accentDark} />
          <path d="M150 64 l26 -30 l-20 4 l14 -28 l-38 36 l18 -2 l-14 22z" fill={accentDark} />
        </g>
      );
    case "wispurr":
      return (
        <g>
          <path d="M42 70 l4 -58 l44 34z" fill={dark} />
          <path d="M158 70 l-4 -58 l-44 34z" fill={dark} />
          <path d="M50 58 l3 -32 l24 20z" fill={accent} />
          <path d="M150 58 l-3 -32 l-24 20z" fill={accent} />
        </g>
      );
    case "sproutle":
      return (
        <g>
          <ellipse cx="44" cy="80" rx="14" ry="18" fill={base} />
          <ellipse cx="156" cy="80" rx="14" ry="18" fill={base} />
        </g>
      );
    case "pebblit":
      return (
        <g>
          <path d="M44 66 l10 -26 l20 14z" fill={light} />
          <path d="M156 66 l-10 -26 l-20 14z" fill={light} />
        </g>
      );
  }
}

function Front({ c }: { c: Creature }) {
  const { accent, accentDark, light } = c.colors;
  switch (c.id) {
    case "embercub":
      return <path d="M100 6 q22 22 10 40 q10 -4 12 -14 q10 18 -6 32 q-16 10 -32 0 q-14 -12 -4 -30 q4 10 10 12 q-10 -20 10 -40z" fill={`url(#${c.id}-accent)`} />;
    case "sproutle":
      return (
        <g>
          <path d="M100 34 q0 -14 4 -22" stroke={accentDark} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M104 14 q30 -18 42 6 q-26 12 -42 -6z" fill={accent} />
          <path d="M102 16 q-26 -20 -40 2 q22 14 40 -2z" fill={accentDark} />
        </g>
      );
    case "splashkit":
      return <path d="M100 18 q16 18 10 30 q-4 8 -10 8 q-6 0 -10 -8 q-6 -12 10 -30z" fill={accent} stroke="#fff" strokeOpacity=".6" strokeWidth="2" />;
    case "zapwing":
      return <path d="M96 22 l18 0 l-8 16 l14 0 l-26 26 l6 -18 l-12 0z" fill={accent} />;
    case "pebblit":
      return (
        <g>
          <path d="M84 40 l8 -32 l14 30z" fill={accent} />
          <path d="M104 38 l12 -26 l8 30z" fill={accentDark} />
          <path d="M88 36 l4 -18 l6 16z" fill="#fff" opacity=".5" />
          <circle cx="132" cy="70" r="5" fill={light} opacity=".7" />
          <circle cx="62" cy="128" r="4" fill={light} opacity=".7" />
        </g>
      );
    case "wispurr":
      return <path d="M100 44 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1z" fill={accent} />;
  }
}

/** Shared gradient definitions (mascots, icons, stage). Render once per page (root layout). */
export function MascotDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>
        {CREATURES.map((c) => (
          <g key={c.id}>
            <radialGradient id={`${c.id}-head`} cx="38%" cy="30%" r="75%">
              <stop offset="0%" stopColor={c.colors.light} />
              <stop offset="55%" stopColor={c.colors.base} />
              <stop offset="100%" stopColor={c.colors.dark} />
            </radialGradient>
            <radialGradient id={`${c.id}-body`} cx="40%" cy="25%" r="80%">
              <stop offset="0%" stopColor={c.colors.light} />
              <stop offset="60%" stopColor={c.colors.base} />
              <stop offset="100%" stopColor={c.colors.dark} />
            </radialGradient>
            <linearGradient id={`${c.id}-accent`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.colors.accent} />
              <stop offset="100%" stopColor={c.colors.accentDark} />
            </linearGradient>
          </g>
        ))}
        <linearGradient id="gem-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dffd8" />
          <stop offset="1" stopColor="#12b98a" />
        </linearGradient>
        <linearGradient id="coin-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="1" stopColor="#e89400" />
        </linearGradient>
        <linearGradient id="flame-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd84a" />
          <stop offset="1" stopColor="#ff5a1f" />
        </linearGradient>
        <linearGradient id="stage-tri" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5fe0" />
          <stop offset="1" stopColor="#ff5fe0" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
