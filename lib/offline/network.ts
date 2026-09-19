"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { syncLibraryToOfflineCache, getSyncMeta } from "./library-cache";
import { processMutationQueue, getMutationQueueCount } from "./queue";

export interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  cachedCount: number;
  pendingMutationsCount: number;
  triggerSync: () => Promise<void>;
}

export function useNetworkStatus(): NetworkState {
  const [isOnline, setIsOnline] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const [cachedCount, setCachedCount] = React.useState<number>(0);
  const [pendingMutationsCount, setPendingMutationsCount] = React.useState<number>(0);

  // Load existing metadata on mount
  React.useEffect(() => {
    getSyncMeta().then((meta) => {
      setLastSyncedAt(meta.lastSyncedAt);
      setCachedCount(meta.count);
    });
    getMutationQueueCount().then((count) => {
      setPendingMutationsCount(count);
    });
  }, []);

  const triggerSync = React.useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      setIsSyncing(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsSyncing(false);
        return;
      }

      // 1. Process safe offline mutation queue first
      await processMutationQueue(supabase, user.id);
      const remainingQueued = await getMutationQueueCount();
      setPendingMutationsCount(remainingQueued);

      // 2. Perform library cache synchronization
      const res = await syncLibraryToOfflineCache(supabase, user.id);
      if (!res.error) {
        setCachedCount(res.count);
        setLastSyncedAt(res.syncedAt);
      }
    } catch (err) {
      console.warn("Offline sync notice:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Listen to browser online/offline events
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sensible re-sync when connection returns
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial background sync if online
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    cachedCount,
    pendingMutationsCount,
    triggerSync,
  };
}
