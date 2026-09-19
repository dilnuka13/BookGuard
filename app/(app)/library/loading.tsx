// Instant library skeleton shown in 0ms on navigation
export default function LibraryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-80 rounded bg-muted/70" />
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="h-11 w-full sm:max-w-md rounded-2xl bg-muted" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-11 w-24 rounded-xl bg-muted" />
          <div className="h-11 w-24 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Book Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card overflow-hidden space-y-2"
          >
            <div className="aspect-[3/4] w-full bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted/60" />
              <div className="h-2.5 w-1/2 rounded bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
