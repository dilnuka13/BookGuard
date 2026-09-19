// Instant camera scanner skeleton shown in 0ms on navigation
export default function ScanLoading() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-xl bg-muted" />
          <div className="h-4 w-72 rounded bg-muted/70" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-muted" />
      </div>

      {/* Viewfinder Shell */}
      <div className="relative w-full h-[calc(100vh-140px)] min-h-[460px] max-h-[780px] rounded-3xl overflow-hidden border border-border bg-card/60 flex flex-col items-center justify-center p-6">
        <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-muted" />
        </div>
        <div className="h-4 w-48 rounded bg-muted mt-6" />
      </div>
    </div>
  );
}
