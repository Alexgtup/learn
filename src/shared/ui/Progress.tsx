interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "gradient" | "gold";
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "gradient",
  showLabel = true,
  className = "",
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes: Record<string, string> = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const fills: Record<string, string> = {
    default: "bg-white/20",
    success: "bg-emerald-500",
    gradient: "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500",
    gold: "bg-gradient-to-r from-amber-400 to-orange-500",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-white/5 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${fills[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-white/40">{Math.round(pct)}%</span>
          <span className="text-xs text-white/40">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
}
