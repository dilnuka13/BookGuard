"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpen, ScanLine, ShoppingCart, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

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
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none"
      style={{
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* ─── Glassmorphism Floating Pill ─── */}
      <div
        className={cn(
          "pointer-events-auto mx-4 flex h-[64px] items-center justify-around",
          "rounded-[32px] px-2",
          // Glass layers: semi-transparent base + blur
          "bg-white/[0.08] dark:bg-white/[0.06]",
          "backdrop-blur-2xl",
          // Border: thin light edge with gradient shimmer effect
          "border border-white/20 dark:border-white/10",
          // Inner top highlight line (glass edge glow)
          "ring-1 ring-inset ring-white/10 dark:ring-white/[0.06]",
          // Soft outer glow / elevation shadow
          "shadow-[0_8px_40px_-6px_rgba(0,0,0,0.25),0_2px_12px_-2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "dark:shadow-[0_8px_40px_-6px_rgba(0,0,0,0.6),0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          /* ── Scan (primary) — elevated glowing circle ── */
          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-5 flex flex-col items-center focus:outline-none"
                aria-label="Scan a book"
              >
                {/* Outer glow ring */}
                <div
                  className={cn(
                    "absolute -inset-1 rounded-full opacity-0 blur-md transition-opacity duration-300",
                    "bg-gradient-to-tr from-emerald-500 to-cyan-400",
                    isActive ? "opacity-60" : "group-hover:opacity-40"
                  )}
                />
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "relative flex h-[56px] w-[56px] items-center justify-center rounded-full",
                    "bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400",
                    "text-white",
                    "border-[3px] border-white/20 dark:border-black/20",
                    // Glass sheen on the button
                    "shadow-[0_4px_24px_-4px_rgba(5,150,105,0.6),inset_0_1px_0_rgba(255,255,255,0.35)]",
                    isActive && "ring-2 ring-primary/60 ring-offset-2 ring-offset-transparent"
                  )}
                >
                  {/* Inner highlight arc */}
                  <span className="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/20 blur-sm" />
                  <Icon className="relative z-10 h-6 w-6 stroke-[2.2]" />
                </motion.div>
                <span
                  className={cn(
                    "mt-1 text-[10px] font-semibold tracking-tight transition-colors",
                    isActive ? "text-primary" : "text-white/60 dark:text-white/50"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5",
                "min-h-[48px] min-w-[52px] rounded-2xl px-2 py-2",
                "transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-white/55 dark:text-white/40 hover:text-white/80"
              )}
            >
              {/* Active glass pill indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className={cn(
                      "absolute inset-x-0.5 top-1 h-[34px] rounded-xl",
                      "bg-white/15 dark:bg-white/10",
                      "border border-white/20 dark:border-white/10",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    )}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="relative z-10"
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-all duration-200",
                    isActive
                      ? "stroke-[2.4] drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                      : "stroke-[1.7] group-hover:scale-110"
                  )}
                />
              </motion.div>

              <span
                className={cn(
                  "relative z-10 text-[10px] font-medium leading-none tracking-tight transition-all duration-200",
                  isActive && "font-semibold"
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
