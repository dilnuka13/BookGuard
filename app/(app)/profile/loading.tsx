// Profile loading skeleton
export default function ProfileLoading() {
  return (
    <div className="space-y-6 max-w-3xl animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      {/* Stats card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-8 w-10 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Profile form card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <div className="space-y-1">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="h-9 w-28 rounded-xl bg-muted" />
          </div>
          {/* Fields */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
          ))}
          <div className="h-10 w-28 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Theme card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="h-10 w-full rounded-xl bg-muted" />
      </div>

      {/* Security card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3.5 w-52 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
