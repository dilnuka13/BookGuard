import * as React from "react";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  showMobileLogo?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  showMobileLogo = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 pb-4 sm:pb-6",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showMobileLogo && (
          <div className="md:hidden">
            <BookGuardLogo variant="mark" href="/" />
          </div>
        )}
        {title && (
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  );
}
