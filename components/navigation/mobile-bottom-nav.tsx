"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpen, ScanLine, ShoppingCart, UserRound } from "lucide-react";
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
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-lg pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-3 flex flex-col items-center focus:outline-none"
                aria-label="Scan a book"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 group-hover:scale-105 border-2 border-background",
                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <Icon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span
                  className={cn(
                    "mt-1 text-[10px] font-semibold tracking-tight transition-colors",
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
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
                "flex min-h-[44px] min-w-[48px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors active:scale-95",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "stroke-[2.4]"
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
              <span className="mt-1 text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
