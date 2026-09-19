"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  variant?: "outline" | "destructive" | "ghost";
}

export function SignOutButton({
  className,
  variant = "outline",
}: SignOutButtonProps) {
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
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="default"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={className}
    >
      {isSigningOut ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </>
      )}
    </Button>
  );
}
