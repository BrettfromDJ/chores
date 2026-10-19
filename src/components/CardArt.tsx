import { getCreature } from "@/lib/creatures";
import { PixelSprite } from "./PixelSprite";

/**
 * Trading-card style frame used for reward goals. Shows the parent's photo when
 * one is set, otherwise original built-in art.
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
  /** Thumbnail size: art only, no text rows. */
  mini?: boolean;
  className?: string;
}) {
  const art = imageUrl.startsWith("art:") ? getCreature(imageUrl.slice(4)) : null;
  const tint = art?.palette.a ?? "#8a5cf6";
  return (
    <div
      className={`relative aspect-[5/7] overflow-hidden rounded-[10px] border-[3px] border-ink p-[6%] shadow-[0_4px_0_rgba(29,26,47,.25)] ${className}`}
      style={{ background: `linear-gradient(160deg, ${tint}, #ffcc33 120%)` }}
    >
      <div className="flex h-full flex-col rounded-[6px] border-2 border-ink/70 bg-paper">
        <div className={`items-center justify-between gap-1 px-[6%] py-[4%] ${mini ? "hidden" : "flex"}`}>
          <span className="truncate font-pixel text-[7px] uppercase leading-tight text-ink">{title}</span>
          {xpCost !== undefined && <span className="shrink-0 font-pixel text-[7px] text-berry">{xpCost}</span>}
        </div>
        <div className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-[4px] border-2 border-ink/70 ${mini ? "m-[6%]" : "mx-[6%]"}`} style={{ background: `radial-gradient(circle at 50% 40%, #fff, ${tint}55)` }}>
          {art ? (
            <PixelSprite creature={art.id} silhouette={locked} className={`h-[78%] w-[78%] ${locked ? "opacity-80" : ""}`} size={120} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title} className={`h-full w-full object-cover ${locked ? "brightness-[.35] grayscale" : ""}`} loading="lazy" referrerPolicy="no-referrer" />
          )}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-pixel text-2xl text-white drop-shadow-[2px_2px_0_#1d1a2f]">?</span>
            </div>
          )}
        </div>
        <div className={`gap-[3%] px-[6%] py-[5%] ${mini ? "hidden" : "flex"}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-ink/15" />
          ))}
        </div>
      </div>
      {holo && !locked && <div className="holo pointer-events-none absolute inset-0" />}
    </div>
  );
}
