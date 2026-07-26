import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 relative overflow-hidden";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:translate-y-[-1px] active:translate-y-[1px]",
    secondary:
      "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
    ghost:
      "text-white/70 hover:text-white hover:bg-white/5",
    danger:
      "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300",
    success:
      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:text-emerald-300",
    gold:
      "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 hover:text-amber-300",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon}
      {children}
    </button>
  );
}
