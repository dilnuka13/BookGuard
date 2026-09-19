"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, BookOpen, ScanLine, ShoppingCart, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { preloadScanner } from "@/components/scanner/scanner-client-wrapper";

interface NavItem {
  name: string;
  href: string;
  icon: typeof House;
  isPrimaryAction?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/", icon: House },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Scan", href: "/scan", icon: ScanLine, isPrimaryAction: true },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Profile", href: "/profile", icon: UserRound },
];

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = React.useState(pathname);

  // Sync optimistic tab whenever actual pathname changes
  React.useEffect(() => {
    setOptimisticHref(pathname);
  }, [pathname]);

  // Aggressively prefetch all tab routes on mount for instant switching
  React.useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });

    // Idle-preload scanner heavy bundle (ZXing, OCR) so it opens in 0ms
    const timer = setTimeout(() => {
      preloadScanner();
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none"
      style={{
        // Lowered position closer to bottom edge, keeping safe room above the home bar
        paddingBottom: "max(0.35rem, calc(0.12rem + env(safe-area-inset-bottom, 0px)))",
      }}
    >
      {/* ─── Premium Glassmorphism Floating Pill ─── */}
      <div
        className={cn(
          "pointer-events-auto mx-3 sm:mx-auto max-w-lg flex h-[60px] items-center justify-around",
          "rounded-[28px] px-1.5",
          // Apple-grade adaptive liquid glass that auto-adjusts to iOS settings
          "liquid-glass"
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const currentPath = optimisticHref || pathname;
          const isActive =
            item.href === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.href);

          /* ── Scan (primary) — elevated glowing button ── */
          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onPointerDown={() => {
                  setOptimisticHref(item.href);
                  router.prefetch(item.href);
                }}
                onTouchStart={() => {
                  setOptimisticHref(item.href);
                  router.prefetch(item.href);
                }}
                className="group relative -top-3.5 flex flex-col items-center focus:outline-none"
                aria-label="Scan a book"
              >
                {/* Outer glow ring */}
                <div
                  className={cn(
                    "absolute -inset-1 rounded-full blur-md transition-opacity duration-300",
                    "bg-gradient-to-tr from-emerald-500 to-cyan-400",
                    isActive ? "opacity-65" : "opacity-0 group-hover:opacity-40"
                  )}
                />
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  className={cn(
                    "relative flex h-[52px] w-[52px] items-center justify-center rounded-full",
                    "bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400",
                    "text-white",
                    // Crisp light-mode and dark-mode border ring
                    "border-[3px] border-white dark:border-slate-900",
                    "shadow-[0_4px_18px_-2px_rgba(5,150,105,0.45),inset_0_1px_0_rgba(255,255,255,0.4)]",
                    isActive && "ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-transparent"
                  )}
                >
                  {/* Sheen reflection highlight */}
                  <span className="absolute inset-x-2 top-1 h-2.5 rounded-full bg-white/25 blur-[1px]" />
                  <Icon className="relative z-10 h-5 w-5 stroke-[2.3]" />
                </motion.div>
                <span
                  className={cn(
                    "mt-0.5 text-[10px] tracking-tight transition-colors duration-150",
                    isActive
                      ? "font-bold text-emerald-600 dark:text-emerald-400"
                      : "font-medium text-slate-600 dark:text-slate-400"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          }

          /* ── Standard Navigation Tabs ── */
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onPointerDown={() => {
                setOptimisticHref(item.href);
                router.prefetch(item.href);
              }}
              onTouchStart={() => {
                setOptimisticHref(item.href);
                router.prefetch(item.href);
              }}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5",
                "h-[48px] min-w-[54px] rounded-2xl px-2 py-1",
                "transition-colors duration-150 focus:outline-none"
              )}
            >
              {/* ── Redesigned Active Capsule (smoothly glides across tabs) ── */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-capsule"
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    // Soft brand tint capsule wrapping icon and text
                    "bg-emerald-500/12 dark:bg-emerald-400/15",
                    "border border-emerald-500/25 dark:border-emerald-400/30",
                    "shadow-[0_2px_12px_-2px_rgba(16,185,129,0.25)]"
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 32,
                  }}
                />
              )}

              {/* Icon */}
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="relative z-10"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-150",
                    isActive
                      ? "stroke-[2.3] text-emerald-600 dark:text-emerald-400 scale-105 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                      : "stroke-[1.8] text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                  )}
                />
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "relative z-10 text-[10px] leading-none tracking-tight transition-all duration-150",
                  isActive
                    ? "font-bold text-emerald-600 dark:text-emerald-400"
                    : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

