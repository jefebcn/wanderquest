import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Apply glass shimmer animation instead of plain pulse */
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--s-bg-card)]",
        shimmer ? "animate-glass-shimmer" : "animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--s-bg-card)] p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function LandmarkCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--s-bg-card)] p-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** 2-column grid of 4 photo cards — for contest photo loading state */
export function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} shimmer className="aspect-[3/4] w-full rounded-2xl" />
      ))}
    </div>
  );
}
