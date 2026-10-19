import { getCreature } from "@/lib/creatures";
import { Mascot } from "./Mascot";
import { CoinIcon, LockIcon } from "./game";

/**
 * Glossy collectible-card frame used for reward goals. Shows the parent's
 * photo when one is set, otherwise original built-in mascot art.
 */
export function CardArt({
  imageUrl,
  title,
  xpCost,
  locked = false,
  holo = false,
  mini = false,
  className = "",
}: {
  imageUrl: string;
  title: string;
  xpCost?: number;
  locked?: boolean;
  holo?: boolean;
  /** Thumbnail size: art only, no text. */
  mini?: boolean;
  className?: string;
}) {
  const art = imageUrl.startsWith("art:") ? getCreature(imageUrl.slice(4)) : null;
  const tint = art?.colors.base ?? "#9f7dff";
  const frame = locked ? "linear-gradient(160deg,#c3c9f2,#8c95cf)" : "linear-gradient(160deg,#fff3a8,#ffcf3a 35%,#f08a00 100%)";

  return (
    <div
      className={`relative aspect-[5/7] overflow-hidden rounded-[14px] border-2 border-night ${mini ? "p-[5%]" : "p-[4.5%]"} ${className}`}
      style={{ background: frame, boxShadow: "inset 0 2px 0 rgba(255,255,255,.6), 0 6px 0 rgba(20,18,74,.45), 0 12px 24px rgba(20,18,74,.3)" }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[10px] border-2 border-night/70" style={{ background: locked ? "#6c74b8" : `radial-gradient(circle at 50% 38%, #fff 0%, ${tint} 60%, ${art?.colors.dark ?? "#5a3dd0"} 100%)` }}>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {art ? (
            <Mascot creature={art.id} silhouette={locked} size={160} className="h-[82%] w-[82%]" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title} className={`h-full w-full object-cover ${locked ? "brightness-[.35] grayscale" : ""}`} loading="lazy" referrerPolicy="no-referrer" />
          )}
          {locked && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LockIcon size={mini ? 18 : 34} className="drop-shadow-[0_2px_0_rgba(20,18,74,.6)]" />
            </span>
          )}
        </div>
        {!mini && (
          <div className="relative bg-night/85 px-[8%] py-[6%] text-center">
            <p className="text-game truncate text-[13px] leading-tight">{title}</p>
          </div>
        )}
      </div>
      {!mini && xpCost !== undefined && (
        <span className="absolute right-[7%] top-[6%] flex items-center gap-0.5 rounded-full bg-night/85 py-0.5 pl-0.5 pr-2 font-display text-[11px] text-white">
          <CoinIcon size={14} /> {xpCost}
        </span>
      )}
      <span className="pointer-events-none absolute -left-1/4 -top-1/4 h-1/2 w-[150%] -rotate-12 bg-white/15" aria-hidden />
      {holo && !locked && <div className="holo pointer-events-none absolute inset-0" />}
    </div>
  );
}
