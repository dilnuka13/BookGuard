import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  badge?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  badge,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center",
        className
      )}
    >
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <Icon className="h-6 w-6 text-foreground" />
      </div>

      {badge && (
        <span className="mb-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {badge}
        </span>
      )}

      <h3 className="text-base sm:text-lg font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild variant="brandGradient">
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : (
            <Button onClick={onAction} variant="brandGradient">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
