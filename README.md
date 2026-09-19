# BookGuard 📚🛡️

<p align="center">
  <img src="public/logos/bookguard-logo-horizontal.png" alt="BookGuard" width="420" />
</p>

<p align="center">
  <strong>Know your shelf before you buy.</strong><br />
  A privacy-first smart personal library and book-shopping companion built to help readers organize their collections, scan books instantly, and avoid accidental duplicate purchases.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/Status-Production%20Ready-16A34A" />
</p>

---

## ✨ What is BookGuard?

BookGuard is a mobile-first Progressive Web App designed for readers who often buy books from bookstores, exhibitions, and book fairs.

Its core purpose is simple:

> **Scan a book → check your personal library → know whether you already own it.**

BookGuard combines **ISBN/barcode scanning**, **English + Sinhala OCR**, **cover-image fingerprinting**, and a **multi-signal duplicate matching engine** to classify a scanned book as:

- 🔴 **Already Owned**
- 🟡 **Possible Duplicate / Different Edition**
- 🟢 **New Book**

Even when connectivity is unreliable, BookGuard can use its local IndexedDB cache to check saved ISBNs against your existing library.

---

## 🚀 Core Experience

```text
Google Sign In
      ↓
Build Your Library
      ↓
Open Smart Scanner
      ↓
Scan ISBN / Barcode / Cover
      ↓
BookGuard checks your shelf
      ↓
┌──────────────────────────────┐
│  🔴 Already Owned            │
│  🟡 Possible Duplicate       │
│  🟢 New Book                 │
└──────────────────────────────┘
      ↓
Library / Wishlist / Cart
      ↓
Book Fair Purchase
      ↓
Purchase History
```

---

## 🌟 Key Features

### 🔐 Authentication & Profiles

- Google OAuth through Supabase Auth
- Guided first-time onboarding
- User profile with name, phone number, and avatar
- Secure session handling with Next.js middleware
- Light, Dark, and System theme support
- User-scoped Row Level Security across all personal data

---

### 📷 Smart Book Scanner

BookGuard uses several independent signals instead of relying on a single recognition method.

#### Barcode & ISBN
- Native browser `BarcodeDetector` where available
- Automatic fallback to `@zxing/browser`
- ISBN-10 and ISBN-13 normalization
- ISBN checksum validation
- `978` / `979` book barcode detection
- Exact ISBN matching against the user's own library first

#### OCR
- Client-side OCR with `tesseract.js`
- English OCR support
- Sinhala OCR support
- Lazy-loaded worker for better performance
- OCR preprocessing with image resizing and contrast enhancement
- Unicode-safe normalization for Sinhala text

#### Cover Matching
- Canvas-based 64-bit difference hash (`dHash`)
- Hamming-distance similarity comparison
- Lightweight cover fingerprint storage
- Visual similarity used as one signal, never blindly trusted

#### Smart Duplicate Engine
BookGuard combines:

- ISBN match
- Title similarity
- Author similarity
- Edition comparison
- Publisher information
- OCR text
- Cover similarity

Possible results:

```text
OWNED
POSSIBLE_DUPLICATE
NEW
UNKNOWN
```

A visual match alone never automatically becomes a definite **Owned** result.

---

## 📚 My Library

Users can build and manage their own private digital bookshelf.

### Library capabilities

- Manual book entry
- Fast Bulk Add mode
- Edit book details
- Delete books safely
- Upload and compress cover images
- Search by title, author, publisher, ISBN, and BookGuard code
- Grid and List layouts
- Sort by:
  - Recently Added
  - Oldest Added
  - Title A–Z / Z–A
  - Author A–Z
  - Published Year
- Filter by:
  - Language
  - Category
  - Author
  - Published Year
- Pagination for larger collections

### ISBN is optional

BookGuard is intentionally designed to support:

- Sri Lankan publications
- Old books
- Tuition handbooks
- Self-published books
- Books without ISBNs

---

## 🛒 Wishlist & Personal Buying Planner

BookGuard includes a lightweight shopping workflow for physical book fairs and bookstores.

### Wishlist

- Save books for later
- Search saved items
- Edit estimated price
- Move books directly to Cart
- Duplicate prevention using ISBN or normalized title + author

### Cart

This is **not an e-commerce checkout system**.

It is a personal buying planner that helps users track books they intend to purchase.

Features:

- Price
- Quantity
- Seller / stall
- Notes
- Estimated total
- Optional spending budget
- Remaining balance
- Over-budget warning

---

## 🎪 Book Fair Mode

`/cart/fair`

A distraction-free mobile interface designed for real book fairs.

Includes:

- Current cart count
- Planned spend
- Budget remaining
- Large **Scan Next Book** action
- Quick purchase logging
- Wishlist / Remove actions
- Mobile safe-area support

---

## ✅ Purchase Workflow

When a user marks a cart item as purchased, BookGuard runs an atomic Supabase PostgreSQL function:

```text
mark_cart_item_purchased
```

The workflow:

1. Validates authenticated ownership
2. Checks for an exact ISBN match in the library
3. Increments quantity if the exact edition already exists
4. Otherwise creates a new library entry
5. Writes an immutable purchase snapshot
6. Removes the item from Cart
7. Cleans matching Wishlist entries
8. Refreshes the offline library cache

The purchase RPC uses a restricted `search_path` and is executable only by authenticated users.

---

## 🧠 Book Metadata Lookup

When an ISBN is detected and the book is not already owned:

1. **Open Library** is queried first
2. **Google Books** is used as a fallback
3. If metadata is unavailable, the user can continue using OCR/manual entry

Supported metadata can include:

- Title
- Author(s)
- Publisher
- Published date
- Edition
- ISBN identifiers
- Cover image
- Page count
- Categories

BookGuard does not depend on paid AI services.

---

## 📡 Offline-First Support

BookGuard is designed for book fairs where internet connectivity can be unreliable.

### IndexedDB cache

Database:

```text
bookguard_offline_v1
```

Stores:

- Library cache
- Sync metadata
- Safe mutation queue

### Offline features

- Instant local ISBN duplicate checks
- Local library lookup
- Dedicated `/offline` screen
- Offline scanner access
- Offline queue for:
  - Add to Wishlist
  - Add to Cart

### Safety rule

Complex purchase mutations are **not** executed offline.

BookGuard explicitly blocks purchase confirmation until connectivity is restored to protect data consistency.

---

## 📱 Progressive Web App

BookGuard is installable as a standalone app.

### Supported experiences

- Chrome / Edge desktop install
- Android home-screen install
- iOS Safari → **Add to Home Screen**
- Standalone display mode
- App icons and maskable icon support
- Apple touch icon
- Offline fallback shell
- Service worker update notifications

### Service Worker strategy

- App shell → cached
- Static assets → cache-first
- Page navigation → network-first
- Supabase authenticated endpoints → network-only
- Internal `/api/*` routes → network-only

Sensitive user data is never stored in public service-worker caches.

---

## 🎨 Design & Accessibility

BookGuard uses a premium navy, emerald, teal, and cyan design system.

### UX details

- Mobile-first
- iPhone safe-area support
- Minimum 44×44px touch targets
- Responsive layouts from small phones to desktop
- Dark / Light / System themes
- Subtle animations
- Optional haptic feedback
- Accessible dialogs
- Keyboard navigation
- Visible focus states
- Screen-reader-friendly status messaging
- `prefers-reduced-motion` support

---

## 🛠️ Technology Stack

| Area | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth + Google OAuth |
| Storage | Supabase Storage |
| Security | Row Level Security |
| Barcode | Native `BarcodeDetector` + ZXing |
| OCR | `tesseract.js` |
| Cover Matching | Canvas + dHash |
| Offline | IndexedDB |
| PWA | Custom Service Worker |
| Metadata | Open Library + Google Books |
| Icons | Lucide React |
| Animation | Framer Motion |

---

## 🗂️ Project Structure

```text
BookGuard/
│
├── app/
│   ├── (auth)/
│   ├── (app)/
│   │   ├── library/
│   │   ├── scan/
│   │   ├── wishlist/
│   │   ├── cart/
│   │   ├── purchases/
│   │   └── profile/
│   ├── api/
│   ├── auth/
│   └── offline/
│
├── components/
│   ├── auth/
│   ├── branding/
│   ├── cart/
│   ├── dashboard/
│   ├── library/
│   ├── navigation/
│   ├── offline/
│   ├── profile/
│   ├── pwa/
│   ├── scanner/
│   ├── scan-history/
│   ├── theme/
│   ├── ui/
│   └── wishlist/
│
├── lib/
│   ├── books/
│   ├── cart/
│   ├── image-hash/
│   ├── isbn/
│   ├── matching/
│   ├── offline/
│   ├── ocr/
│   ├── purchases/
│   ├── scanner/
│   ├── storage/
│   ├── supabase/
│   ├── utils/
│   └── wishlist/
│
├── public/
│   ├── icons/
│   ├── logos/
│   ├── manifest.webmanifest
│   └── sw.js
│
├── supabase/
│   └── migrations/
│
├── types/
├── .env.example
├── README.md
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional
GOOGLE_BOOKS_API_KEY=
```

> Never commit `.env.local`, service-role keys, database passwords, or Google OAuth client secrets.

---

## 🗄️ Supabase Migration Order

Run migrations in this exact order:

```text
1. 20260919_phase01_foundation.sql
2. 20260919_phase02_library.sql
3. 20260919_phase03_smart_scanner.sql
4. 20260919_phase04_shopping_offline.sql
5. 20260919_phase05_production_hardening.sql
```

### Phase 01
- Profiles
- Google-auth profile trigger
- Avatar bucket
- Profile RLS

### Phase 02
- Library items
- Book cover storage
- pg_trgm
- Library indexes
- Library RLS

### Phase 03
- Scan history
- OCR / cover fingerprint fields
- Scanner indexes
- Scan-history RLS

### Phase 04
- Wishlist
- Cart
- Purchase history
- Atomic purchase RPC
- Shopping RLS

### Phase 05
- Production RPC hardening
- Authenticated-only execution
- Composite ISBN indexes
- Security improvements

---

## 🔑 Google OAuth Setup

### Google Cloud Console

Create a **Web Application OAuth Client**.

Authorized JavaScript Origins:

```text
http://localhost:3000
https://your-production-domain.com
```

Authorized Redirect URI:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

### Supabase

Go to:

```text
Authentication → Providers → Google
```

Enable Google and configure your OAuth Client ID and Client Secret.

Then:

```text
Authentication → URL Configuration
```

Development:

```text
Site URL:
http://localhost:3000

Redirect URL:
http://localhost:3000/auth/callback
```

Production:

```text
Site URL:
https://your-production-domain.com

Redirect URL:
https://your-production-domain.com/auth/callback
```

---

## 💻 Local Development

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/BookGuard.git
cd BookGuard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Then add your Supabase values.

### 4. Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Validation & Production Build

### TypeScript

```bash
npx tsc --noEmit
```

### ESLint

```bash
npm run lint
```

### Production build

```bash
npm run build
```

### Production server

```bash
npm run start
```

---

## 🔒 Security Model

BookGuard treats user privacy as a core architectural requirement.

### Row Level Security

Enabled on:

```text
profiles
library_items
scan_history
wishlist_items
cart_items
purchase_history
```

Each user's personal records are scoped through authenticated identity.

### Storage

Buckets:

```text
avatars
book-covers
```

Files are stored under user-specific paths:

```text
{user_id}/...
```

Users cannot modify another user's storage objects.

### Purchase RPC

`mark_cart_item_purchased`:

- Requires authenticated execution
- Uses `auth.uid()`
- Verifies cart ownership
- Verifies library ownership
- Uses restricted `search_path`
- Uses parameterized SQL
- Writes purchase history using authenticated identity
- Removes only the authenticated user's matching Wishlist/Cart data

### OAuth redirect security

OAuth return paths are sanitized to internal relative paths to prevent open redirects.

### Secrets

The browser never receives:

- Supabase service-role key
- Database password
- Google OAuth client secret

---

## ⚡ Performance

BookGuard is heavily code-split.

### Scanner

The Smart Scanner is dynamically loaded only on `/scan`.

### OCR

`tesseract.js` is loaded only when cover OCR is actually requested.

### ZXing

ZXing loads only if the browser does not support native `BarcodeDetector`.

### Covers

- Client-side resize
- WebP compression
- Fixed-ratio containers
- Lazy image loading

### Current optimized first-load targets

```text
Dashboard: ~125 kB
Scanner route shell: ~113 kB
```

Heavy scanner and OCR logic is deferred until needed.

---

## 📲 Installing BookGuard

### Android / Desktop

Open BookGuard in a supported browser and choose:

```text
Install BookGuard
```

### iPhone / iPad

Open in Safari:

```text
Share → Add to Home Screen
```

---

## 🧭 Main Routes

```text
/                  Dashboard
/library           My Library
/library/add       Add Book
/library/bulk-add  Bulk Add
/scan              Smart Scanner
/scan/history      Scan History
/wishlist          Wishlist
/cart              Buying Planner
/cart/fair         Book Fair Mode
/purchases         Purchase History
/profile           Profile
/offline           Offline Shell
```

---

## 🧩 BookGuard Matching Philosophy

BookGuard prioritizes accuracy over aggressive automation.

```text
Exact ISBN
    ↓
Strong title + author
    ↓
Edition awareness
    ↓
OCR agreement
    ↓
Cover similarity
```

If confidence is uncertain, BookGuard chooses:

```text
POSSIBLE DUPLICATE
```

instead of incorrectly claiming:

```text
ALREADY OWNED
```

This reduces false positives and keeps the final decision with the user.

---

## 🗺️ Future Ideas

Potential future enhancements:

- Shared household libraries
- Family / classroom shelves
- Public shareable book lists
- Publisher / bookstore integrations
- Optional cloud AI recognition fallback
- Price comparison
- Reading progress
- Lending tracker
- Book reviews and ratings
- ISBN export / import
- CSV library backup
- Multi-currency purchase tracking

---

## 🛡️ Privacy

BookGuard is designed as a **personal library first**.

The user's:

- books
- scan history
- wishlist
- cart
- purchases
- uploaded covers

remain scoped to their authenticated account through Supabase Row Level Security.

---

## 📌 Project Status

```text
Phase 01  ✅ Foundation + Authentication
Phase 02  ✅ Personal Library
Phase 03  ✅ Smart Scanner
Phase 04  ✅ Shopping Planner + Offline Cache
Phase 05  ✅ PWA + Production Hardening
```

### Current Status

**Production-ready application architecture**

---

## 👨‍💻 Development Notes

Before deploying to production:

1. Apply all Supabase migrations in order
2. Configure Google OAuth production origins
3. Configure Supabase production Site URL and redirect URLs
4. Set production environment variables
5. Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

6. Test Google login, camera permissions, offline mode, and PWA installation on a real mobile device

---

<p align="center">
  <img src="public/logos/bookguard-logo-mark.png" alt="BookGuard Mark" width="90" />
</p>

<p align="center">
  <strong>BookGuard</strong><br />
  <em>Know your shelf before you buy.</em>
</p>
