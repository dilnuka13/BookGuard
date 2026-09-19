"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { validateAndFormatPhone } from "@/lib/utils/phone";
import {
  compressAvatarToWebP,
  validateAvatarFile,
} from "@/lib/utils/image";
import type { Profile } from "@/types/profile";
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface OnboardingWizardProps {
  initialProfile: Profile;
  userEmail: string;
}

export function OnboardingWizard({
  initialProfile,
  userEmail,
}: OnboardingWizardProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [step, setStep] = React.useState<1 | 2>(1);
  const [fullName, setFullName] = React.useState(initialProfile.full_name || "");
  const [phone, setPhone] = React.useState(initialProfile.phone || "");
  const [avatarUrl, setAvatarUrl] = React.useState(initialProfile.avatar_url || "");
  const [pendingAvatarFile, setPendingAvatarFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      setFormError(validation.error || "Invalid file format");
      return;
    }

    setPendingAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFormError(null);
  };

  // Phone changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    if (phoneError) setPhoneError(null);
  };

  const handlePhoneBlur = () => {
    if (!phone.trim()) return;
    const result = validateAndFormatPhone(phone);
    if (result.isValid) {
      setPhone(result.formatted);
      setPhoneError(null);
    } else {
      setPhoneError(result.error || "Please enter a valid phone number");
    }
  };

  // Step navigation
  const handleNextStep = () => {
    setFormError(null);
    setStep(2);
  };

  const handlePrevStep = () => {
    setFormError(null);
    setStep(1);
  };

  // Submit onboarding
  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Full Name is required.");
      return;
    }

    const phoneResult = validateAndFormatPhone(phone);
    if (!phoneResult.isValid) {
      setPhoneError(phoneResult.error || "Please enter a valid phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = createClient();
      let finalAvatarUrl = avatarUrl;

      // Upload compressed avatar if provided
      if (pendingAvatarFile) {
        const webpBlob = await compressAvatarToWebP(pendingAvatarFile);
        const fileName = `${initialProfile.id}/avatar-${Date.now()}.webp`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, webpBlob, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload avatar: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

        finalAvatarUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: initialProfile.id,
            email: userEmail,
            full_name: fullName.trim(),
            phone: phoneResult.normalized,
            avatar_url: finalAvatarUrl,
            onboarding_completed: true,
          },
          { onConflict: "id" }
        );

      if (updateError) {
        throw new Error(`Failed to save profile: ${updateError.message}`);
      }

      // Celebratory feedback
      setIsCompleted(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#06B6D4", "#0D9488"],
        });
      } catch {
        // Fallback gracefully if canvas-confetti has environment limitations
      }

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1400);
    } catch (err) {
      console.error("Onboarding error:", err);
      setFormError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to BookGuard!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your profile is ready. Taking you to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Photo & Identity
          </span>
        </div>

        <div className="h-[2px] w-12 bg-border mx-2" />

        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact Details
          </span>
        </div>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Profile Photo */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Add Your Profile Photo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Make your account personal. You can keep your Google photo or upload a new one.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
              <UserAvatar
                src={previewUrl || avatarUrl}
                name={fullName || userEmail}
                size="xl"
                className="ring-4 ring-primary/20"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 active:scale-95 border-2 border-background"
                aria-label="Upload avatar image"
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPendingAvatarFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              JPEG, PNG, or WebP up to 5MB
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="brandGradient"
              size="lg"
              onClick={handleNextStep}
              className="w-full sm:w-auto"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Name & Phone */}
      {step === 2 && (
        <form onSubmit={handleFinishOnboarding} className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Contact Details
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Almost done! Confirm your name and Sri Lankan contact number.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="onboardingFullName">Full Name</Label>
              <Input
                id="onboardingFullName"
                type="text"
                required
                placeholder="e.g. Kasun Perera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="onboardingEmail">Google Email</Label>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <Input
                id="onboardingEmail"
                type="email"
                readOnly
                disabled
                value={userEmail}
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="onboardingPhone">Phone Number</Label>
              <Input
                id="onboardingPhone"
                type="tel"
                required
                placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                error={Boolean(phoneError)}
              />
              {phoneError ? (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {phoneError}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Format: 07XXXXXXXX or +947XXXXXXXX
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePrevStep}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            <Button
              type="submit"
              variant="brandGradient"
              size="lg"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Setting Up...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
