import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface ProfileFormData {
  fullName: string;
  phone: string;
  avatarFile: File | null;
  avatarUrl: string;
}

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  normalized: string;
  error?: string;
}
