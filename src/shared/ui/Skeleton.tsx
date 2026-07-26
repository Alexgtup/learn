interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = "", lines = 1 }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-white/[0.05] rounded animate-pulse"
          style={{
            width: `${70 + Math.random() * 30}%`,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
