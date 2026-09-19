"use client";

import * as React from "react";
import Link from "next/link";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-6">
        <BookGuardLogo variant="mark" priority />
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {error.message ||
            "We encountered an unexpected error. Don't worry, your data is safe."}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="brandGradient"
            onClick={() => reset()}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
