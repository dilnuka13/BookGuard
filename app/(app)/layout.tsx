import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { UserAvatar } from "@/components/profile/user-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NetworkStatus } from "@/components/offline/network-status";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure onboarding is completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (visible on md+) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        {/* Network & Offline Status Banner */}
        <NetworkStatus />

        {/* Mobile Top Header (hidden on md+) */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md md:hidden pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
          <BookGuardLogo variant="mark" href="/" />

          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="button" className="h-9 w-9 rounded-xl" />
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="View profile"
            >
              <UserAvatar
                src={profile.avatar_url}
                name={profile.full_name || user.email}
                size="sm"
              />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content with bottom nav padding for mobile */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-bottom-nav md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (hidden on md+) */}
      <MobileBottomNav />
    </div>
  );
}
