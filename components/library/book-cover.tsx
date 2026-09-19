"use client";

import * as React from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BookCoverProps {
  url?: string | null;
  title: string;
  author?: string | null;
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "w-12 h-18 text-[10px]",
  md: "w-20 h-28 text-xs",
  lg: "w-32 h-44 sm:w-36 sm:h-52 text-sm",
  xl: "w-44 h-64 sm:w-52 sm:h-76 text-base",
};

export function BookCover({
  url,
  title,
  author,
  className,
  priority = false,
  size = "md",
}: BookCoverProps) {
  const [hasError, setHasError] = React.useState(false);

  // Derive initials from title (first letter of first 2 words)
  const initials = React.useMemo(() => {
    if (!title) return "BG";
    const words = title.trim().split(/\s+/).slice(0, 2);
    return words.map((w) => w[0]?.toUpperCase() || "").join("");
  }, [title]);

  const showImage = Boolean(url && !hasError);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/80 shadow-sm bg-muted/40 shrink-0 aspect-[2/3] flex items-center justify-center select-none group",
        SIZE_CLASSES[size],
        className
      )}
    >
      {showImage && url ? (
        <Image
          src={url}
          alt={`Cover of ${title}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 160px, 240px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setHasError(true)}
          unoptimized={url.startsWith("blob:") || url.startsWith("data:")}
        />
      ) : (
        /* Elegant fallback cover with BookGuard styling */
        <div className="absolute inset-0 flex flex-col items-center justify-between p-2.5 bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950 text-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/80">
          <div className="w-full flex justify-between items-center opacity-40">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-mono text-[9px] tracking-wider font-bold">
              {initials}
            </span>
          </div>

          <div className="my-auto text-center px-1">
            <p className="line-clamp-3 font-serif font-bold text-[11px] leading-tight text-white/90">
              {title}
            </p>
            {author && (
              <p className="line-clamp-1 mt-1 text-[9px] text-emerald-400/90 font-sans font-medium">
                {author}
              </p>
            )}
          </div>

          <div className="w-full h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
        </div>
      )}
    </div>
  );
}
