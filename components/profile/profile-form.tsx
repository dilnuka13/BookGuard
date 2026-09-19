"use client";

import * as React from "react";
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
import { Camera, Check, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialProfile: Profile;
  onSuccess?: () => void;
}

export function ProfileForm({ initialProfile, onSuccess }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = React.useState(initialProfile.full_name || "");
  const [phone, setPhone] = React.useState(initialProfile.phone || "");
  const [avatarUrl, setAvatarUrl] = React.useState(initialProfile.avatar_url || "");
  const [pendingAvatarFile, setPendingAvatarFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Handle phone blur/input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (phoneError) {
      setPhoneError(null);
    }
  };

  const handlePhoneBlur = () => {
    if (!phone.trim()) return;
    const result = validateAndFormatPhone(phone);
    if (result.isValid) {
      setPhone(result.formatted);
      setPhoneError(null);
    } else {
      setPhoneError(result.error || "Invalid phone number");
    }
  };

  // Handle avatar file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      setFormError(validation.error || "Invalid file");
      return;
    }

    setPendingAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccess(false);

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
      setIsSaving(true);
      const supabase = createClient();
      let updatedAvatarUrl = avatarUrl;

      // If a new avatar file was chosen, compress and upload to Supabase Storage
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

        updatedAvatarUrl = publicUrl;
      }

      // Update database profile record
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phoneResult.normalized,
          avatar_url: updatedAvatarUrl,
          onboarding_completed: true,
        })
        .eq("id", initialProfile.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setAvatarUrl(updatedAvatarUrl);
      setPendingAvatarFile(null);
      setSaveSuccess(true);
      router.refresh();

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3500);
    } catch (err) {
      console.error("Profile save error:", err);
      setFormError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while saving profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl border border-border bg-card">
        <div className="relative mx-auto sm:mx-0">
          <UserAvatar
            src={previewUrl || avatarUrl}
            name={fullName || initialProfile.email}
            size="lg"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 active:scale-95 border-2 border-background"
            aria-label="Upload profile image"
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

        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-semibold text-foreground">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-optimized to WebP. Recommended square image up to 5MB.
          </p>

          <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-2">
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
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            required
            placeholder="e.g. Kasun Perera"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* Email (Read-only from Google) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Email Address</Label>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Google Account (Verified)
            </span>
          </div>
          <Input
            id="email"
            type="email"
            readOnly
            disabled
            value={initialProfile.email || ""}
            className="bg-muted/50 cursor-not-allowed text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground">
            Linked to your Google sign-in. Cannot be modified directly.
          </p>
        </div>

        {/* Phone Number (Sri Lankan friendly) */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
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

      {/* Error and Success notifications */}
      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>Profile successfully updated!</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="brandGradient"
        size="lg"
        disabled={isSaving}
        className="w-full sm:w-auto"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving Changes...</span>
          </>
        ) : (
          <span>Save Profile</span>
        )}
      </Button>
    </form>
  );
}
