"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  /** When provided, the component self-fetches profile data client-side.
   *  This removes the need for the parent layout to make a server-side
   *  profiles DB query on every navigation. */
  userId?: string;
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
  src: srcProp,
  name: nameProp,
  userId,
  size = "md",
  className,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [fetchedSrc, setFetchedSrc] = React.useState<string | null>(null);
  const [fetchedName, setFetchedName] = React.useState<string | null>(null);

  // Self-fetch profile when userId is provided (layout optimization path).
  // Runs once client-side; parent layout no longer needs a server profiles query.
  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setFetchedSrc(data.avatar_url ?? null);
        setFetchedName(data.full_name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const sizeConfig = SIZE_MAP[size];

  const src = srcProp ?? fetchedSrc;
  const name = nameProp ?? fetchedName;

  // Derive initials from name
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
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-sm select-none aspect-square",
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
          className="h-full w-full object-cover aspect-square rounded-full"
          onError={() => setImageError(true)}
          unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
