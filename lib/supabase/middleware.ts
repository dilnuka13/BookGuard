import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Static files, PWA assets, public APIs, offline shell, and OAuth callback are completely bypassed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logos") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline" ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/keep-alive") ||
    pathname.startsWith("/api/books/lookup") ||
    pathname.startsWith("/remote-scan") ||
    pathname.startsWith("/api/remote-scan")
  ) {
    return supabaseResponse;
  }

  // Use getUser() rather than getSession() to securely validate session with Supabase auth server
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (err) {
    // Network or offline fallback: user is treated as unauthenticated
    user = null;
  }

  // 1. Unauthenticated users:
  if (!user) {
    if (pathname !== "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      if (pathname !== "/") {
        url.searchParams.set("returnTo", pathname);
      }
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. Authenticated user: inspect onboarding status
  let onboardingCompleted = false;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.onboarding_completed) {
      onboardingCompleted = true;
    }
  } catch {
    onboardingCompleted = false;
  }

  // If user is already on /login:
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = onboardingCompleted ? "/" : "/onboarding";
    return NextResponse.redirect(url);
  }

  // If onboarding is incomplete, redirect to /onboarding
  if (!onboardingCompleted && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // If onboarding is complete and user visits /onboarding, redirect to /
  if (onboardingCompleted && pathname === "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Attach the verified user-id as a response header so the layout can read
  // it without making a second getUser() round-trip.
  if (user) {
    supabaseResponse.headers.set("x-bookguard-user-id", user.id);
  }

  return supabaseResponse;
}
