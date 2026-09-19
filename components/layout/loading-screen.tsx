"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({
  message = "Loading BookGuard...",
  fullScreen = false,
  className,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center select-none",
        fullScreen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" : "min-h-[260px] w-full",
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-4">
        {/* Subtle glowing ring behind the mark */}
        <div className="absolute h-16 w-16 rounded-full bg-emerald-500/20 blur-md animate-pulse" />

        <div className="relative h-14 w-14 rounded-2xl bg-card border border-border p-2 shadow-sm">
          <Image
            src="/logos/bookguard-logo-mark.png"
            alt="BookGuard Loading"
            width={56}
            height={56}
            priority
            className="h-full w-full object-contain animate-pulse"
          />
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
}
