// Scan page loading skeleton
export default function ScanLoading() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-muted" />
      </div>

      {/* Scanner viewport skeleton */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="aspect-[4/3] bg-muted relative">
          {/* Scan frame corners */}
          <div className="absolute inset-8 border-2 border-muted-foreground/20 rounded-xl" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-4 w-56 rounded bg-muted mx-auto" />
          <div className="flex gap-3 justify-center">
            <div className="h-10 w-32 rounded-xl bg-muted" />
            <div className="h-10 w-32 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
