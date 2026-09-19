import Link from "next/link";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { Button } from "@/components/ui/button";
import { FileQuestion, House } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-6">
        <BookGuardLogo variant="horizontal" priority />
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild variant="brandGradient">
            <Link href="/">
              <House className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
