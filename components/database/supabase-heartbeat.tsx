"use client";

import * as React from "react";

const LAST_PING_KEY = "bookguard_supabase_last_keep_alive";
const PING_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Client-side background heartbeat.
 * Whenever the user uses BookGuard on their phone or computer,
 * it automatically verifies when the last keep-alive signal was sent.
 * If >24 hours have elapsed, it quietly fires a keep-alive ping to reset
 * Supabase's 7-day inactivity pause counter.
 */
export function SupabaseHeartbeat() {
  React.useEffect(() => {
    try {
      const lastPingStr = localStorage.getItem(LAST_PING_KEY);
      const lastPing = lastPingStr ? parseInt(lastPingStr, 10) : 0;
      const now = Date.now();

      if (now - lastPing > PING_INTERVAL_MS) {
        // Send background keep-alive ping without blocking UI
        fetch("/api/keep-alive")
          .then((res) => {
            if (res.ok) {
              localStorage.setItem(LAST_PING_KEY, now.toString());
            }
          })
          .catch(() => {
            // Fails silently if offline
          });
      }
    } catch {
      // Ignore localStorage errors in private browsing
    }
  }, []);

  return null;
}
