"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  BookOpen,
  ScanLine,
  ShoppingCart,
  UserRound,
  Bookmark,
  ReceiptText,
  Shield,
} from "lucide-react";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserAvatar } from "@/components/profile/user-avatar";
import { cn } from "@/lib/utils/cn";

interface MobileHeaderProps {
  userId: string;
}

const PAGE_MAP: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  "/": {
    label: "Home",
    icon: House,
    color: "text-emerald-500",
  },
  "/library": {
    label: "My Library",
    icon: BookOpen,
    color: "text-blue-500",
  },
  "/scan": {
    label: "Smart Scanner",
    icon: ScanLine,
    color: "text-teal-500",
  },
  "/cart": {
    label: "Cart Planner",
    icon: ShoppingCart,
    color: "text-violet-500",
  },
  "/wishlist": {
    label: "Wishlist",
    icon: Bookmark,
    color: "text-pink-500",
  },
  "/purchases": {
    label: "Purchases",
    icon: ReceiptText,
    color: "text-amber-500",
  },
  "/profile": {
    label: "Profile",
    icon: UserRound,
    color: "text-cyan-500",
  },
};

function getPageInfo(pathname: string) {
  // Exact match first
  if (PAGE_MAP[pathname]) return PAGE_MAP[pathname];
  // Prefix match (e.g. /library/123)
  const match = Object.keys(PAGE_MAP)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_MAP[match] : PAGE_MAP["/"];
}

export function MobileHeader({ userId }: MobileHeaderProps) {
  const pathname = usePathname();
  const page = getPageInfo(pathname);
  const PageIcon = page.icon;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 md:hidden",
        "flex items-center justify-between",
        "px-3.5",
        // Apple-grade adaptive liquid glass that auto-adjusts to iOS settings
        "liquid-glass border-b border-t-0 border-x-0 rounded-none shadow-sm"
      )}
      style={{
        paddingTop: "max(0px, env(safe-area-inset-top, 0px))",
        height: "calc(46px + max(0px, env(safe-area-inset-top, 0px)))",
      }}
    >
      {/* ── Left: Logo mark + dynamic page label ── */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/"
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          aria-label="BookGuard Home"
        >
          <BookGuardLogo
            variant="mark"
            withBackdropInDark={false}
            imageClassName="h-7 w-7"
          />
        </Link>

        {/* Divider */}
        <span className="h-3.5 w-px bg-border/60 shrink-0" />

        {/* Animated page title */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center gap-1.5 min-w-0"
          >
            <PageIcon
              className={cn("h-3.5 w-3.5 shrink-0", page.color)}
              strokeWidth={2.2}
            />
            <span className="text-xs sm:text-sm font-semibold text-foreground truncate leading-none">
              {page.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Shield badge — subtle brand identity */}
        <div
          className={cn(
            "hidden xs:flex items-center gap-1 rounded-full px-2 py-0.5",
            "bg-emerald-500/10 border border-emerald-500/20",
            "text-emerald-600 dark:text-emerald-400"
          )}
        >
          <Shield className="h-3 w-3" strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide">GUARD</span>
        </div>

        <ThemeToggle
          variant="button"
          className="h-7 w-7 rounded-xl bg-transparent hover:bg-white/10"
        />

        <Link
          href="/profile"
          className="group relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="View profile"
        >
          {/* Subtle ambient glow behind avatar */}
          <span
            className="absolute -inset-0.5 rounded-full aspect-square bg-gradient-to-tr from-emerald-500/40 via-teal-400/30 to-cyan-400/40 blur-[5px] opacity-75 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            aria-hidden="true"
          />

          {/* Glowing highlight frame ring */}
          <div className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full aspect-square p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_2px_8px_rgba(16,185,129,0.35)] transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
            {/* Inner clip container guaranteeing perfect circle avatar */}
            <div className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden rounded-full aspect-square bg-background ring-1 ring-black/10 dark:ring-white/10">
              <UserAvatar
                userId={userId}
                size="sm"
                className="h-full w-full min-h-0 min-w-0 border-0 shadow-none aspect-square object-cover"
              />
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
