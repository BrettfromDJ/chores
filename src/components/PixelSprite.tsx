import { getCreature, spriteGrid } from "@/lib/creatures";

export function PixelSprite({
  creature,
  size = 64,
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
  const grid = spriteGrid(c);
  const rects: React.ReactNode[] = [];
  grid.forEach((row, y) =>
    row.forEach((key, x) => {
      if (key === ".") return;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={silhouette ? "#1d1a2f" : c.palette[key]} />);
    }),
  );
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className={`pixelated ${className}`} role="img" aria-label={title ?? c.name}>
      {rects}
    </svg>
  );
}
