interface SkeletonProps {
  className?: string;
  lines?: number;
  width?: string;
  height?: string;
}

export default function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--color-surface-container-high)] ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[var(--color-surface-container)] ghost-border p-5 space-y-3" aria-hidden="true">
      <Skeleton width="40%" height="12px" />
      <Skeleton width="60%" height="24px" />
      <Skeleton width="30%" height="10px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      <Skeleton className="w-full h-10 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="w-full h-12 rounded-lg" />
      ))}
    </div>
  );
}
