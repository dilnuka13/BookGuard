"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  BookOpen,
  ScanLine,
  ShoppingCart,
  Bookmark,
  ReceiptText,
  UserRound,
  LogOut,
} from "lucide-react";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import * as React from "react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof House;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/", icon: House },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Scan", href: "/scan", icon: ScanLine },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Wishlist", href: "/wishlist", icon: Bookmark },
  { name: "Purchases", href: "/purchases", icon: ReceiptText },
  { name: "Profile", href: "/profile", icon: UserRound },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error signing out:", err);
      setIsSigningOut(false);
    }
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-border bg-card/95 backdrop-blur-sm"
    >
      {/* Top Branding */}
      <div className="flex h-16 items-center px-5 border-b border-border/50 shrink-0">
        <BookGuardLogo
          variant="horizontal"
          href="/"
          priority
          withBackdropInDark={false}
          imageClassName="h-8 w-auto max-w-[160px]"
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-105",
                    isActive
                      ? "text-primary stroke-[2.2]"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </div>

              {isActive && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Controls: Theme Toggle and Sign Out */}
      <div className="border-t border-border/60 p-4 space-y-3.5 bg-card/30">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Appearance
            </span>
          </div>
          <ThemeToggle variant="segmented" className="w-full" />
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}
