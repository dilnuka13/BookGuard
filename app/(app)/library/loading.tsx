// Library loading skeleton
export default function LibraryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 rounded-xl bg-muted" />
        <div className="h-10 w-36 rounded-xl bg-muted" />
        <div className="h-10 w-36 rounded-xl bg-muted" />
        <div className="h-10 w-10 rounded-xl bg-muted" />
      </div>

      {/* Book grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="aspect-[3/4] bg-muted" />
            <div className="p-3 space-y-1.5">
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
