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
        "px-4 h-[60px]",
        // Apple-grade adaptive liquid glass that auto-adjusts to iOS settings
        "liquid-glass border-b border-t-0 border-x-0 rounded-none shadow-sm"
      )}
      style={{
        paddingTop: "max(0px, env(safe-area-inset-top, 0px))",
        height: "calc(60px + max(0px, env(safe-area-inset-top, 0px)))",
      }}
    >
      {/* ── Left: Logo mark + dynamic page label ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href="/"
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          aria-label="BookGuard Home"
        >
          <BookGuardLogo
            variant="mark"
            withBackdropInDark={false}
            imageClassName="h-8 w-8"
          />
        </Link>

        {/* Divider */}
        <span className="h-5 w-px bg-border/60 shrink-0" />

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
              className={cn("h-4 w-4 shrink-0", page.color)}
              strokeWidth={2.2}
            />
            <span className="text-sm font-semibold text-foreground truncate leading-none">
              {page.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-2 shrink-0">
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
          className="h-8 w-8 rounded-xl bg-transparent hover:bg-white/10"
        />

        <Link
          href="/profile"
          className="flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="View profile"
        >
          {/* Avatar with ring glow */}
          <div className="relative">
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 blur-sm" />
            <div className="relative rounded-full ring-1 ring-white/20">
              <UserAvatar userId={userId} size="sm" />
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
