/** Segmented retro progress bar. */
export function XpBar({
  value,
  max,
  color = "#38b26b",
  segments = 20,
  className = "",
  label,
}: {
  value: number;
  max: number;
  color?: string;
  segments?: number;
  className?: string;
  label?: string;
}) {
  const pct = max <= 0 ? 1 : Math.max(0, Math.min(1, value / max));
  const filled = Math.round(pct * segments);
  return (
    <div
      className={`flex h-4 gap-[2px] border-[3px] border-ink bg-ink p-[2px] ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-label={label}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className="h-full flex-1 transition-colors duration-500"
          style={{ background: i < filled ? color : "#3b3656", transitionDelay: `${i * 25}ms` }}
        />
      ))}
    </div>
  );
}
