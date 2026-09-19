// Purchases loading skeleton
export default function PurchasesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-lg bg-muted" />
        <div className="h-4 w-88 rounded bg-muted" />
      </div>

      {/* Purchase list */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Purchase header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
            {/* Books in purchase */}
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex gap-3 px-5 py-3 border-b border-border last:border-b-0">
                <div className="h-16 w-11 rounded bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-1/4 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
