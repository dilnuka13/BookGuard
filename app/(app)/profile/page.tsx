import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Palette, Shield, User, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  // Fetch real counts for library, wishlist, cart, and purchases
  const [
    { count: bookCount },
    { count: wishlistCount },
    { count: cartCount },
    { count: purchaseCount },
  ] = await Promise.all([
    supabase
      .from("library_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("wishlist_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("purchase_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const formattedJoinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Profile & Settings"
        description="Manage your personal details, theme preferences, and account security."
      />

      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Activity & Collection Overview</span>
          </div>
          <CardTitle>My BookGuard Stats</CardTitle>
          <CardDescription>
            Real-time summary of your shelf catalog, wishlist, and purchasing activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/library"
              className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-colors block"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Library</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{bookCount ?? 0}</p>
              <span className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                View Shelf &rarr;
              </span>
            </Link>

            <Link
              href="/wishlist"
              className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-colors block"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Wishlist</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{wishlistCount ?? 0}</p>
              <span className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                View Saved &rarr;
              </span>
            </Link>

            <Link
              href="/cart"
              className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-colors block"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Cart Planner</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{cartCount ?? 0}</p>
              <span className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                View Cart &rarr;
              </span>
            </Link>

            <Link
              href="/purchases"
              className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-colors block"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Purchases</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{purchaseCount ?? 0}</p>
              <span className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                View History &rarr;
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Profile Edit Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <User className="h-4 w-4" />
            <span>Personal Information</span>
          </div>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Update your full name, Sri Lankan phone number, and avatar image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialProfile={profile} />
        </CardContent>
      </Card>

      {/* Theme Preferences Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </div>
          <CardTitle>Theme Preference</CardTitle>
          <CardDescription>
            Choose between Light, Dark, or System mode to match your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Interface Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customizes colors and contrast across all BookGuard views.
            </p>
          </div>
          <ThemeToggle variant="segmented" className="sm:w-72" />
        </CardContent>
      </Card>

      {/* Security & Account Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            <span>Account Session</span>
          </div>
          <CardTitle>Session Security</CardTitle>
          <CardDescription>
            Signed in via Google OAuth. Member since {formattedJoinDate}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">User ID: <span className="font-mono text-[11px] text-muted-foreground">{user.id}</span></p>
            <p>Account role: <span className="font-semibold uppercase text-emerald-600 dark:text-emerald-400">{profile.role}</span></p>
          </div>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
