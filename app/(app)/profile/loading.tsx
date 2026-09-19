// Instant profile skeleton shown in 0ms on navigation
export default function ProfileLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-xl bg-muted" />
        <div className="h-4 w-72 rounded bg-muted/70" />
      </div>

      {/* User Card */}
      <div className="rounded-3xl border border-border bg-card p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-3.5 w-64 rounded bg-muted/60" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-7 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
