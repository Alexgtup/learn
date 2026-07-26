import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "glass" | "gradient";
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  variant = "default",
  className = "",
  hover = true,
  onClick,
}: CardProps) {
  const base = "rounded-2xl p-5 transition-all duration-300";

  const variants: Record<string, string> = {
    default: "bg-white/[0.03] border border-white/[0.06]",
    elevated:
      "bg-white/[0.05] border border-white/[0.08] shadow-xl shadow-black/20",
    glass:
      "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]",
    gradient:
      "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20",
  };

  const hoverStyles = hover
    ? "hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"
    : "";

  const clickable = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`${base} ${variants[variant]} ${hoverStyles} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
