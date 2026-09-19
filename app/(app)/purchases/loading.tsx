// Instant purchases skeleton shown in 0ms on navigation
export default function PurchasesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-80 rounded bg-muted/70" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-11 rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-44 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted/60" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
