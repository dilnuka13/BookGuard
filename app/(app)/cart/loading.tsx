// Cart loading skeleton
export default function CartLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-52 rounded-lg bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
      </div>

      {/* Budget summary skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-9 w-28 rounded-lg bg-muted" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-xl bg-muted" />
            <div className="h-10 w-28 rounded-xl bg-muted" />
          </div>
        </div>
      </div>

      {/* Cart items skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex gap-4">
              <div className="h-20 w-14 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="flex gap-2 mt-2">
                  <div className="h-8 w-20 rounded-lg bg-muted" />
                  <div className="h-8 w-20 rounded-lg bg-muted" />
                </div>
              </div>
              <div className="h-6 w-16 rounded bg-muted shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
