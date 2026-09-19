// Wishlist loading skeleton
export default function WishlistLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      {/* Wishlist items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex gap-4">
              <div className="h-20 w-14 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-8 w-8 rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
