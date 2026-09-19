import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type LogoVariant = "horizontal" | "mark" | "icon";

interface BookGuardLogoProps {
  variant?: LogoVariant;
  className?: string;
  imageClassName?: string;
  href?: string;
  priority?: boolean;
  withBackdropInDark?: boolean;
}

const LOGO_PATHS: Record<LogoVariant, string> = {
  horizontal: "/logos/bookguard-logo-horizontal.png",
  mark: "/logos/bookguard-logo-mark.png",
  icon: "/logos/bookguard-app-icon.png",
};

const DEFAULT_DIMENSIONS: Record<
  LogoVariant,
  { width: number; height: number; aspectRatio: string }
> = {
  horizontal: { width: 440, height: 120, aspectRatio: "440 / 120" },
  mark: { width: 200, height: 200, aspectRatio: "1 / 1" },
  icon: { width: 200, height: 200, aspectRatio: "1 / 1" },
};

export function BookGuardLogo({
  variant = "horizontal",
  className,
  imageClassName,
  href,
  priority = false,
  withBackdropInDark = true,
}: BookGuardLogoProps) {
  const { width, height } = DEFAULT_DIMENSIONS[variant];
  const src = LOGO_PATHS[variant];

  const content = (
    <div
      className={cn(
        "relative inline-flex items-center justify-center transition-transform",
        // In dark mode, provide a clean soft backdrop pill so the deep navy 'Book' letters have perfect contrast
        withBackdropInDark && variant === "horizontal" && [
          "dark:bg-slate-100/95 dark:px-4 dark:py-2 dark:rounded-2xl dark:shadow-sm",
        ],
        withBackdropInDark && variant === "mark" && [
          "dark:bg-slate-100/95 dark:p-2 dark:rounded-2xl dark:shadow-sm",
        ],
        className
      )}
    >
      <Image
        src={src}
        alt="BookGuard Logo"
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-auto w-auto object-contain select-none",
          variant === "horizontal" && "h-12 sm:h-14 w-auto max-w-[260px] sm:max-w-[300px]",
          variant === "mark" && "h-10 w-10 sm:h-12 sm:w-12",
          variant === "icon" && "h-14 w-14 rounded-2xl shadow-md",
          imageClassName
        )}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        aria-label="BookGuard Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
