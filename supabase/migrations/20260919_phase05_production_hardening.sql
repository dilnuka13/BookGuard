-- ============================================================================
-- BOOKGUARD: Phase 05 Production Hardening Migration
-- RPC Permission Hardening & Safe Performance Indexes
-- ============================================================================

-- 1. Hardening RPC Function Permissions
-- Revoke all execution permissions on mark_cart_item_purchased from PUBLIC / anon
-- Grant execution strictly to authenticated role.
-- Note exact argument signature: (uuid, date, numeric, integer, text, text)
revoke execute on function public.mark_cart_item_purchased(uuid, date, numeric, integer, text, text) from public;
revoke execute on function public.mark_cart_item_purchased(uuid, date, numeric, integer, text, text) from anon;
grant execute on function public.mark_cart_item_purchased(uuid, date, numeric, integer, text, text) to authenticated;

-- 2. Safe Composite Performance Indexes for User Scans & Fast Candidate Filtering
create index if not exists idx_library_items_user_isbn13 on public.library_items(user_id, isbn13) where isbn13 is not null;
create index if not exists idx_library_items_user_isbn10 on public.library_items(user_id, isbn10) where isbn10 is not null;
create index if not exists idx_library_items_user_cover_hash on public.library_items(user_id, cover_hash) where cover_hash is not null;

-- 3. Add explicit comments on security definer function documenting ownership requirements
comment on function public.mark_cart_item_purchased(uuid, date, numeric, integer, text, text) is 
  'Atomic purchase transaction: moves cart item into library_items and purchase_history. Enforces strict auth.uid() ownership checks on all mutated entities with fixed search_path.';
