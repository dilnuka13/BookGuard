import { headers } from "next/headers";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { MobileHeader } from "@/components/navigation/mobile-header";
import { NetworkStatus } from "@/components/offline/network-status";
import { PageTransition } from "@/components/layout/page-transition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware has already verified auth and onboarding — it handles all
  // redirects before this layout renders. We simply trust the verified
  // userId that middleware passes via the x-bookguard-user-id header.
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (visible on md+) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        {/* Network & Offline Status Banner */}
        <NetworkStatus />

        {/* Mobile Top Header (hidden on md+) */}
        <MobileHeader userId={userId} />

        {/* Dynamic Page Content with smooth transition animation */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-bottom-nav md:pb-8 max-w-6xl w-full mx-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (hidden on md+) */}
      <MobileBottomNav />
    </div>
  );
}
