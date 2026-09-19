# BookGuard 📚🛡️

> **Know your shelf before you buy.**
> A smart, privacy-first personal book library and shopping companion Progressive Web App (PWA) that helps readers organize their collections and prevents duplicate book purchases.

---

## 🚀 Overview

BookGuard combines barcode camera scanning, client-side OCR for English and Sinhala text recognition, perceptual cover image hashing (dHash), and a multi-signal matching engine with an offline-first IndexedDB cache. Whether you are browsing a local bookstore or walking through a crowded book fair without reliable cellular reception, BookGuard tells you instantly if you already own a book, if you own another edition, or if it is completely new to your collection.

---

## ✨ Features

- **Google OAuth & User Profiles:** Fast, secure single sign-on with onboarding flow and avatar storage.
- **Smart Scanner:**
  - Fast barcode scanning powered by native `BarcodeDetector` with dynamic `@zxing/browser` fallback.
  - Client-side OCR supporting English and Sinhala title recognition with `tesseract.js` (lazy-loaded on demand).
  - Perceptual image hashing (dHash) to match book covers across editions.
  - Multi-tier duplicate matching: `OWNED` (exact ISBN or title+author match), `POSSIBLE_DUPLICATE` (title match with edition/publisher difference), or `NEW`.
  - Scan history tracking with timestamped snapshots.
- **My Library Catalog:**
  - Manual add, bulk ISBN/title add, edit, and deletion.
  - Full-text and trigram fuzzy search across titles, authors, publishers, and ISBNs.
  - Sorting and category/language filtering.
  - Optimized book cover storage and image compression.
- **Personal Buying Planner (Cart & Wishlist):**
  - Save interesting discoveries to your Wishlist.
  - Plan book fair purchases with budget tracking, remaining balance calculations, and total planned spend.
  - **Book Fair Mode (`/cart/fair`):** Streamlined, high-contrast mobile interface with quick purchase logging while browsing fairs.
  - **Atomic Purchase RPC (`mark_cart_item_purchased`):** Safely moves purchased cart items to your library, increments copies if the exact edition is already owned, writes an immutable purchase history record, and cleans up cart and wishlist entries.
- **Progressive Web App (PWA) & Offline Shell:**
  - Installable on desktop (Chrome/Edge), Android, and iOS (Add to Home Screen).
  - Custom service worker caching app shell, static assets, and dedicated `/offline` page.
  - IndexedDB cache storing your personal library for zero-latency offline duplicate checks.
  - **Safe Offline Mutation Queue:** Queue "Add to Cart" and "Add to Wishlist" operations while offline; automatically syncs sequentially upon reconnection with duplicate protection.
  - Explicit offline safety blocks: Purchases require online connectivity to guarantee library consistency.
- **Accessibility & Design:**
  - System, Light, and Dark mode support with harmonious navy, emerald, and teal color palette.
  - iOS Safe Area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - Motion accessibility respecting `prefers-reduced-motion`.
  - Subtle native haptic feedback (`navigator.vibrate`) on mobile devices.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS with custom HSL brand design tokens
- **Database & Auth:** Supabase (PostgreSQL 15, Row Level Security, Storage Buckets, GoTrue OAuth)
- **Offline Storage:** IndexedDB (Schema v2 with `library_cache`, `meta`, and `mutation_queue`)
- **Service Worker:** Custom lightweight Service Worker (`/public/sw.js`)
- **Computer Vision & OCR:**
  - Native `BarcodeDetector` API + `@zxing/browser` / `@zxing/library`
  - `tesseract.js` for English & Sinhala OCR
  - Canvas-based 64-bit grayscale difference hashing (`dHash`)
- **Metadata Sources (Free & Open):**
  - Open Library Books API
  - Google Books API (fallback)

---

## 📋 Environment Variables

Create a `.env.local` file in the project root based on `.env.example`:

```bash
# Supabase Project Credentials (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Optional: Google Books API Key
# If omitted, Open Library is used with unauthenticated Google Books fallback.
GOOGLE_BOOKS_API_KEY=
```

---

## 🗄️ Supabase Migration Order

Run the following additive SQL migrations sequentially in the Supabase SQL Editor:

1. `supabase/migrations/20260919_phase01_foundation.sql`
   - Profiles table, handle_new_user trigger, handle_updated_at trigger, avatar storage bucket, and profile RLS.
2. `supabase/migrations/20260919_phase02_library.sql`
   - Library items table, book-covers storage bucket, pg_trgm extension, search indexes, and library RLS.
3. `supabase/migrations/20260919_phase03_smart_scanner.sql`
   - Scan history table, cover_hash column, trigram indexes, and scan history RLS.
4. `supabase/migrations/20260919_phase04_shopping_offline.sql`
   - Wishlist items, Cart items, Purchase history tables, performance indexes, and atomic `mark_cart_item_purchased` RPC function.
5. `supabase/migrations/20260919_phase05_production_hardening.sql`
   - Revokes public execute on `mark_cart_item_purchased` (restricted strictly to `authenticated`), adds user-specific composite ISBN indexes, and strengthens search paths.

---

## 🔑 Google OAuth Setup

1. **Google Cloud Console:**
   - Navigate to **APIs & Services** → **Credentials**.
   - Create an **OAuth 2.0 Client ID** (Web Application).
   - Add Authorized JavaScript Origins:
     - Development: `http://localhost:3000`
     - Production: `https://your-production-domain.com`
   - Set Authorized Redirect URI to your Supabase callback:
     `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard:**
   - Go to **Authentication** → **Providers** → **Google**.
   - Enable Google and enter your Google Client ID and Google Client Secret.
3. **Supabase URL Configuration:**
   - Go to **Authentication** → **URL Configuration**.
   - Set **Site URL** to `https://your-production-domain.com` (or `http://localhost:3000` for local testing).
   - Under **Redirect URLs**, add:
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain.com/auth/callback`

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Build & Typecheck Verification

Run TypeScript check:
```bash
npx tsc --noEmit
```

Build production bundle:
```bash
npm run build
```

Start production server:
```bash
npm run start
```

---

## 📱 PWA & Offline Usage

- **Installation:**
  - Chrome / Edge: Click the "Install BookGuard" button in the address bar or app banner.
  - iOS Safari: Tap **Share** (`📤`) → **Add to Home Screen**.
- **Offline Shell:**
  - When disconnected from the internet, navigating to any un-cached page displays the dedicated `/offline` page.
  - You can perform instant ISBN searches against your cached library in IndexedDB and launch the camera barcode scanner.
  - Any books added to your Wishlist or Cart while offline are stored in IndexedDB and replayed once your device reconnects.

---

## 🔒 Security Audit Summary

- **Row Level Security (RLS):** Enabled and enforced on all tables (`profiles`, `library_items`, `scan_history`, `wishlist_items`, `cart_items`, `purchase_history`). All policies require `auth.uid() = user_id`.
- **Storage Security:** `book-covers` and `avatars` buckets enforce user-scoped folder paths (`{user_id}/*`). Users cannot write or delete other users' cover files.
- **Purchase RPC (`mark_cart_item_purchased`):**
  - Runs with `SECURITY DEFINER` and restricted `search_path = public, auth, pg_temp`.
  - Enforces `v_user_id := auth.uid()` and validates ownership of all cart items, library items, and wishlist entries.
  - Public and anonymous execution privileges are revoked.
- **Auth Redirect Security:** The `/auth/callback` route validates and sanitizes all return URLs to relative internal application paths, completely eliminating open redirect vectors.
- **Environment Isolation:** Zero private secrets or API keys are exposed to the browser.
#   B o o k G u a r d  
 