import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ShieldCheck, BookMarked, Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <ThemeToggle variant="button" />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Brand Card */}
        <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-xl p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/40 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <BookGuardLogo variant="horizontal" priority className="scale-105" />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Know your shelf before you buy.
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              Your smart personal book library that prevents duplicate purchases.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 space-y-3 text-left">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Zero Duplicate Purchases
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Check your library instantly before making a book purchase.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <BookMarked className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Personal Catalog
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Keep your entire physical book collection organized in one place.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Simple & Private
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Securely authenticated with your Google account.
                </p>
              </div>
            </div>
          </div>

          {/* Google Sign In CTA */}
          <div className="mt-8">
            <GoogleSignInButton />
          </div>

          {/* Privacy Footnote */}
          <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
            By signing in, you agree to BookGuard&apos;s privacy-first terms. We only use your Google profile to secure your account.
          </p>
        </div>

        {/* Brand mark footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>BookGuard &copy; {new Date().getFullYear()} &bull; Phase 01</p>
        </div>
      </div>
    </main>
  );
}
