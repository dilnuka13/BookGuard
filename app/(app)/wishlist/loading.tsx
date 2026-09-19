// Instant wishlist skeleton shown in 0ms on navigation
export default function WishlistLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-xl bg-muted" />
        <div className="h-4 w-72 rounded bg-muted/70" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3.5 rounded-2xl border border-border bg-card p-4">
            <div className="h-24 w-16 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted/60" />
              <div className="h-3 w-1/2 rounded bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
