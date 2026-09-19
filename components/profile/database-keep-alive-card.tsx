"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ShieldCheck, Zap, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function DatabaseKeepAliveCard() {
  const [isPinging, setIsPinging] = React.useState(false);
  const [pingResult, setPingResult] = React.useState<{
    success: boolean;
    latency?: string;
    timestamp?: string;
    message?: string;
  } | null>(null);

  const handleManualPing = async () => {
    setIsPinging(true);
    setPingResult(null);

    try {
      const res = await fetch("/api/keep-alive");
      const data = await res.json();
      setPingResult({
        success: data.success,
        latency: data.latency,
        timestamp: new Date().toLocaleTimeString(),
        message: data.message || "Keep-alive signal received.",
      });
    } catch (err) {
      setPingResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection error",
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Database className="h-4 w-4" />
            <span>Cloud Database Keeper</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            7-Day Inactivity Shield Active
          </span>
        </div>
        <CardTitle className="text-base sm:text-lg">Supabase Keep-Alive System</CardTitle>
        <CardDescription className="text-xs">
          Prevents Supabase Free Tier from automatically pausing after 7 days of inactivity.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Automated Cloud Cron</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              GitHub Actions automatically sends a keep-alive signal every 3 days even when BookGuard is closed.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>In-App Heartbeat</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Every time you open BookGuard, a silent background ping resets the 7-day pause timer.
            </p>
          </div>
        </div>

        {/* Live Feedback of Manual Ping */}
        {pingResult && (
          <div
            className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium ${
              pingResult.success
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {pingResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <span>{pingResult.message}</span>
              {pingResult.latency && (
                <span className="ml-1.5 font-mono text-[10px] opacity-85">
                  ({pingResult.latency} • {pingResult.timestamp})
                </span>
              )}
            </div>
          </div>
        )}

        <div className="pt-1 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Inactivity Pause: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Prevented</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualPing}
            disabled={isPinging}
            className="rounded-xl gap-1.5 h-9 text-xs font-semibold shadow-xs"
          >
            {isPinging ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span>{isPinging ? "Sending..." : "Send Signal Now"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
