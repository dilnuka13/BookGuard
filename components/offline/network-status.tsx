"use client";

import * as React from "react";
import { WifiOff, RefreshCw, CheckCircle, Database } from "lucide-react";
import { useNetworkStatus } from "@/lib/offline/network";

export function NetworkStatus() {
  const { isOnline, isSyncing, cachedCount, triggerSync } = useNetworkStatus();
  const [justReconnected, setJustReconnected] = React.useState(false);
  const wasOfflineRef = React.useRef(false);

  React.useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // 1. Offline Mode Banner / Pill
  if (!isOnline) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Offline Mode</strong> &bull; Basic library duplicate checks active ({cachedCount} cached {cachedCount === 1 ? "book" : "books"}).
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] opacity-80">
          Book details & cloud sync will resume when online
        </span>
      </div>
    );
  }

  // 2. Just Reconnected Toast
  if (justReconnected) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-between gap-2 bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-700 dark:text-emerald-300 backdrop-blur-md animate-fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Connection restored. Online services & cloud sync are active.</span>
        </div>
      </div>
    );
  }

  // 3. Actively Syncing Indicator (subtle floating indicator or top pill)
  if (isSyncing) {
    return (
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 rounded-full bg-card/90 border border-border px-3 py-1.5 shadow-md text-xs text-muted-foreground backdrop-blur-md animate-fade-in">
        <RefreshCw className="h-3 w-3 animate-spin text-primary" />
        <span>Updating offline library cache...</span>
      </div>
    );
  }

  // Online and silent: no clutter
  return null;
}
