import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { OnboardingWizard } from "@/components/profile/onboarding-wizard";
import type { Profile } from "@/types/profile";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch or construct initial profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If already completed, redirect to app dashboard
  if (profile?.onboarding_completed) {
    redirect("/");
  }

  const initialProfile: Profile = profile || {
    id: user.id,
    email: user.email ?? null,
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "",
    phone: null,
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
    role: "user",
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background ambient gradient accents */}
      <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center text-center">
          <BookGuardLogo variant="horizontal" href="/" priority />
          <p className="mt-2 text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
            Account Setup
          </p>
        </div>

        {/* Wizard Card */}
        <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/30">
          <OnboardingWizard
            initialProfile={initialProfile}
            userEmail={user.email || ""}
          />
        </div>
      </div>
    </main>
  );
}
