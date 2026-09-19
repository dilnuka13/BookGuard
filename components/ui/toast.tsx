"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast: addToast,
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error"),
      warning: (msg) => addToast(msg, "warning"),
      info: (msg) => addToast(msg, "info"),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Viewport */}
      <aside
        aria-label="Notifications"
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((item) => {
          const isSuccess = item.type === "success";
          const isError = item.type === "error";
          const isWarning = item.type === "warning";

          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200",
                isSuccess &&
                  "border-emerald-500/30 bg-card/95 text-foreground dark:bg-card/95 shadow-emerald-500/10",
                isError &&
                  "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20 shadow-destructive/10",
                isWarning &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-amber-500/10",
                (!item.type || item.type === "info") &&
                  "border-border bg-card/95 text-foreground shadow-black/10"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                {isError && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {isWarning && (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                {(!item.type || item.type === "info") && (
                  <Info className="h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="text-xs font-semibold leading-snug break-words">
                  {item.message}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if invoked outside provider
    return {
      toast: (msg) => console.log("[Toast]", msg),
      success: (msg) => console.log("[Toast Success]", msg),
      error: (msg) => console.error("[Toast Error]", msg),
      warning: (msg) => console.warn("[Toast Warning]", msg),
      info: (msg) => console.info("[Toast Info]", msg),
    };
  }
  return ctx;
}
