// Dashboard loading skeleton — shown instantly on navigation before data arrives
export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* Welcome header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded-full bg-muted" />
          <div className="h-8 w-72 rounded-lg bg-muted" />
          <div className="h-4 w-80 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-28 rounded-xl bg-muted" />
          <div className="h-11 w-24 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-12 rounded-lg bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Hero card skeleton */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-7 w-80 rounded-lg bg-muted" />
            <div className="h-4 w-96 rounded bg-muted" />
            <div className="h-4 w-72 rounded bg-muted" />
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-28 rounded-xl bg-muted" />
            <div className="h-11 w-32 rounded-xl bg-muted" />
          </div>
        </div>
      </div>

      {/* Recent books skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-48 rounded-lg bg-muted" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-[3/4] bg-muted" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
