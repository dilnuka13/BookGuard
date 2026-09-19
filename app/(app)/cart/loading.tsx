// Instant cart planner skeleton shown in 0ms on navigation
export default function CartLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-muted" />
        <div className="h-4 w-96 rounded bg-muted/70" />
      </div>

      {/* Budget Bar Skeleton */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-3 w-full rounded-full bg-muted" />
      </div>

      {/* Cart Items Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-20 w-14 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted/60" />
              <div className="h-4 w-20 rounded bg-muted/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
