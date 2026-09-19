import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") || "/";
  // Strict sanitization: enforce safe relative internal application path (prevent open redirect)
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
      ? rawNext
      : "/";

  if (code) {
    const supabase = await createClient();

    // 1. Exchange the auth code for a valid Supabase session
    const { data: authData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin
        )
      );
    }

    const user = authData?.user;
    if (user) {
      // 2. Fetch or safely ensure user's profile exists
      let onboardingCompleted = false;

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          onboardingCompleted = profile.onboarding_completed;
        } else {
          // If profile does not exist yet (e.g. database trigger was not installed or delayed),
          // safely upsert initial profile from Google auth metadata
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "";
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            "";

          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              full_name: fullName,
              avatar_url: avatarUrl,
              role: "user",
              onboarding_completed: false,
            },
            { onConflict: "id" }
          );

          onboardingCompleted = false;
        }
      } catch (err) {
        console.error("Profile check error during auth callback:", err);
        onboardingCompleted = false;
      }

      // 3. Route according to onboarding status
      if (!onboardingCompleted) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }

      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  // Fallback if no code provided
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
