-- ============================================================================
-- BOOKGUARD: Phase 03 Database & Security Migration
-- Smart Scanner, Cover Hash, OCR, Metadata Sources, and Scan History Table
-- ============================================================================

-- 1. Extend public.library_items with scanner fields
alter table public.library_items
  add column if not exists cover_hash text null,
  add column if not exists ocr_text text null,
  add column if not exists metadata_source text null,
  add column if not exists ocr_language text null;

-- Index for cover hash lookup per user
create index if not exists idx_library_items_cover_hash
  on public.library_items(user_id, cover_hash)
  where cover_hash is not null;

-- 2. Create public.scan_history table
create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scanned_isbn text null,
  detected_title text null,
  detected_author text null,
  detected_publisher text null,
  detected_edition text null,
  cover_hash text null,
  ocr_text text null,
  match_type text not null check (match_type in ('OWNED', 'POSSIBLE_DUPLICATE', 'NEW', 'UNKNOWN')),
  match_confidence numeric null,
  matched_library_item_id uuid null references public.library_items(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Performance Indexes on scan_history
create index if not exists idx_scan_history_user_id
  on public.scan_history(user_id);

create index if not exists idx_scan_history_user_created
  on public.scan_history(user_id, created_at desc);

-- 4. Enable Row Level Security (RLS) on scan_history
alter table public.scan_history enable row level security;

-- Policy: Users can view only their own scan history
drop policy if exists "Users can view own scan history" on public.scan_history;
create policy "Users can view own scan history"
  on public.scan_history
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert only their own scan history
drop policy if exists "Users can insert own scan history" on public.scan_history;
create policy "Users can insert own scan history"
  on public.scan_history
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete only their own scan history
drop policy if exists "Users can delete own scan history" on public.scan_history;
create policy "Users can delete own scan history"
  on public.scan_history
  for delete
  using (auth.uid() = user_id);
