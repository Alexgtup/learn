interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold" | "purple";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-full";

  const variants: Record<string, string> = {
    default: "bg-white/5 text-white/60 border border-white/10",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    danger: "bg-red-500/15 text-red-400 border border-red-500/25",
    info: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    gold: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
    purple: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
  };

  const sizes: Record<string, string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
