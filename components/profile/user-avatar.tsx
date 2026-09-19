"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: {
    container: "h-9 w-9 min-h-[36px] min-w-[36px] text-xs",
    px: 36,
  },
  md: {
    container: "h-11 w-11 min-h-[44px] min-w-[44px] text-sm",
    px: 44,
  },
  lg: {
    container: "h-16 w-16 min-h-[64px] min-w-[64px] text-lg",
    px: 64,
  },
  xl: {
    container: "h-24 w-24 min-h-[96px] min-w-[96px] text-2xl",
    px: 96,
  },
};

export function UserAvatar({
  src,
  name,
  size = "md",
  className,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const sizeConfig = SIZE_MAP[size];

  // Derive initials
  const initials = React.useMemo(() => {
    if (!name) return "BG";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const hasImage = Boolean(src && !imageError);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-sm select-none",
        sizeConfig.container,
        !hasImage &&
          "bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 font-bold text-white",
        className
      )}
    >
      {hasImage && src ? (
        <Image
          src={src}
          alt={name ? `${name}'s avatar` : "User avatar"}
          width={sizeConfig.px}
          height={sizeConfig.px}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
