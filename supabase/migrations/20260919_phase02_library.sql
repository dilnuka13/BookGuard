-- ============================================================================
-- BOOKGUARD: Phase 02 Database & Security Migration
-- Library Items, Book Covers Storage, and Row Level Security (RLS)
-- ============================================================================

-- 1. Create Library Items Table
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_code text not null,
  title text not null,
  normalized_title text not null,
  author text null,
  normalized_author text null,
  isbn10 text null,
  isbn13 text null,
  barcode text null,
  publisher text null,
  edition text null,
  published_year integer null,
  language text null,
  category text null,
  cover_url text null,
  cover_storage_path text null,
  quantity integer not null default 1 check (quantity >= 1),
  purchase_price numeric(12,2) null check (purchase_price is null or purchase_price >= 0),
  purchase_date date null,
  purchase_place text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Performance Indexes
create index if not exists idx_library_items_user_id on public.library_items(user_id);
create index if not exists idx_library_items_user_created on public.library_items(user_id, created_at desc);
create index if not exists idx_library_items_user_norm_title on public.library_items(user_id, normalized_title);
create index if not exists idx_library_items_user_norm_author on public.library_items(user_id, normalized_author);
create index if not exists idx_library_items_isbn13 on public.library_items(isbn13) where isbn13 is not null;
create index if not exists idx_library_items_isbn10 on public.library_items(isbn10) where isbn10 is not null;
create index if not exists idx_library_items_book_code on public.library_items(user_id, book_code);

-- Enable pg_trgm extension for fast substring/fuzzy search if supported
create extension if not exists pg_trgm;

-- Trigram GIN indexes for title and author search
create index if not exists idx_library_items_trgm_title
  on public.library_items using gin (normalized_title gin_trgm_ops);

create index if not exists idx_library_items_trgm_author
  on public.library_items using gin (normalized_author gin_trgm_ops);

-- 3. Automatic Timestamp Trigger
drop trigger if exists set_library_items_updated_at on public.library_items;
create trigger set_library_items_updated_at
  before update on public.library_items
  for each row
  execute function public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.library_items enable row level security;

-- Policy: Users can view only their own books
drop policy if exists "Users can view own library items" on public.library_items;
create policy "Users can view own library items"
  on public.library_items
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert only their own books
drop policy if exists "Users can insert own library items" on public.library_items;
create policy "Users can insert own library items"
  on public.library_items
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update only their own books
drop policy if exists "Users can update own library items" on public.library_items;
create policy "Users can update own library items"
  on public.library_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete only their own books
drop policy if exists "Users can delete own library items" on public.library_items;
create policy "Users can delete own library items"
  on public.library_items
  for delete
  using (auth.uid() = user_id);

-- 5. Book Covers Storage Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies:
-- 5a. Public read access to book covers
drop policy if exists "Book covers are publicly readable" on storage.objects;
create policy "Book covers are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'book-covers');

-- 5b. Users can upload only to their own user folder: {user_id}/*
drop policy if exists "Users can upload their own book covers" on storage.objects;
create policy "Users can upload their own book covers"
  on storage.objects
  for insert
  with check (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5c. Users can update their own book cover files
drop policy if exists "Users can update their own book covers" on storage.objects;
create policy "Users can update their own book covers"
  on storage.objects
  for update
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5d. Users can delete their own book cover files
drop policy if exists "Users can delete their own book covers" on storage.objects;
create policy "Users can delete their own book covers"
  on storage.objects
  for delete
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
