-- ============================================================================
-- BOOKGUARD: Phase 04 Database & Security Migration
-- Personal Book Buying Planner (Cart), Wishlist, Purchase History & RPC
-- ============================================================================

-- 1. Create public.wishlist_items table
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid null references public.library_items(id) on delete set null,
  title text not null,
  author text null,
  isbn10 text null,
  isbn13 text null,
  publisher text null,
  edition text null,
  published_year integer null,
  cover_url text null,
  source text null,
  estimated_price numeric(12,2) null check (estimated_price is null or estimated_price >= 0),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create public.cart_items table (Personal Book Fair Buying Planner)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text null,
  isbn10 text null,
  isbn13 text null,
  publisher text null,
  edition text null,
  published_year integer null,
  cover_url text null,
  source text null,
  price numeric(12,2) null check (price is null or price >= 0),
  quantity integer not null default 1 check (quantity >= 1),
  seller text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create public.purchase_history table (Immutable buying record)
create table if not exists public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid null references public.library_items(id) on delete set null,
  title text not null,
  author text null,
  isbn10 text null,
  isbn13 text null,
  edition text null,
  cover_url text null,
  quantity integer not null default 1 check (quantity >= 1),
  price numeric(12,2) null check (price is null or price >= 0),
  seller text null,
  purchase_date date not null default current_date,
  total_amount numeric(12,2) null check (total_amount is null or total_amount >= 0),
  notes text null,
  created_at timestamptz not null default now()
);

-- 4. Triggers for updated_at
drop trigger if exists set_wishlist_items_updated_at on public.wishlist_items;
create trigger set_wishlist_items_updated_at
  before update on public.wishlist_items
  for each row
  execute function public.handle_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row
  execute function public.handle_updated_at();

-- 5. Performance Indexes
create index if not exists idx_wishlist_items_user_id on public.wishlist_items(user_id);
create index if not exists idx_wishlist_items_user_created on public.wishlist_items(user_id, created_at desc);
create index if not exists idx_wishlist_items_isbn13 on public.wishlist_items(user_id, isbn13) where isbn13 is not null;

create index if not exists idx_cart_items_user_id on public.cart_items(user_id);
create index if not exists idx_cart_items_user_created on public.cart_items(user_id, created_at desc);
create index if not exists idx_cart_items_isbn13 on public.cart_items(user_id, isbn13) where isbn13 is not null;

create index if not exists idx_purchase_history_user_id on public.purchase_history(user_id);
create index if not exists idx_purchase_history_user_date on public.purchase_history(user_id, purchase_date desc);
create index if not exists idx_purchase_history_user_created on public.purchase_history(user_id, created_at desc);

-- 6. Row Level Security (RLS)
alter table public.wishlist_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.purchase_history enable row level security;

-- Policies: wishlist_items
drop policy if exists "Users can view own wishlist" on public.wishlist_items;
create policy "Users can view own wishlist"
  on public.wishlist_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own wishlist" on public.wishlist_items;
create policy "Users can insert own wishlist"
  on public.wishlist_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own wishlist" on public.wishlist_items;
create policy "Users can update own wishlist"
  on public.wishlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own wishlist" on public.wishlist_items;
create policy "Users can delete own wishlist"
  on public.wishlist_items for delete
  using (auth.uid() = user_id);

-- Policies: cart_items
drop policy if exists "Users can view own cart" on public.cart_items;
create policy "Users can view own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cart" on public.cart_items;
create policy "Users can insert own cart"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cart" on public.cart_items;
create policy "Users can update own cart"
  on public.cart_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cart" on public.cart_items;
create policy "Users can delete own cart"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- Policies: purchase_history
drop policy if exists "Users can view own purchase history" on public.purchase_history;
create policy "Users can view own purchase history"
  on public.purchase_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own purchase history" on public.purchase_history;
create policy "Users can insert own purchase history"
  on public.purchase_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own purchase history" on public.purchase_history;
create policy "Users can update own purchase history"
  on public.purchase_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own purchase history" on public.purchase_history;
create policy "Users can delete own purchase history"
  on public.purchase_history for delete
  using (auth.uid() = user_id);

-- 7. Atomic Purchase Transaction Function (RPC)
-- Secure SECURITY DEFINER function with locked search_path and auth.uid() ownership check.
create or replace function public.mark_cart_item_purchased(
  p_cart_item_id uuid,
  p_purchase_date date default current_date,
  p_price numeric default null,
  p_quantity integer default 1,
  p_seller text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_cart_item record;
  v_existing_lib_item record;
  v_existing_lib_id uuid;
  v_target_lib_id uuid;
  v_purchase_history_id uuid;
  v_unit_price numeric(12,2);
  v_qty integer;
  v_total numeric(12,2);
  v_new_book_code text;
begin
  -- 1. Ensure caller is authenticated
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: Authentication required.';
  end if;

  -- 2. Fetch and lock cart item, verifying ownership
  select * into v_cart_item
  from public.cart_items
  where id = p_cart_item_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Cart item not found or unauthorized.';
  end if;

  v_qty := coalesce(p_quantity, v_cart_item.quantity, 1);
  if v_qty < 1 then
    v_qty := 1;
  end if;

  v_unit_price := coalesce(p_price, v_cart_item.price);
  if v_unit_price is not null then
    v_total := v_unit_price * v_qty;
  else
    v_total := null;
  end if;

  -- 3. Check if exact ISBN is already in user's library
  v_existing_lib_id := null;
  if v_cart_item.isbn13 is not null or v_cart_item.isbn10 is not null then
    select id, quantity into v_existing_lib_item
    from public.library_items
    where user_id = v_user_id
      and (
        (v_cart_item.isbn13 is not null and isbn13 = v_cart_item.isbn13)
        or (v_cart_item.isbn10 is not null and isbn10 = v_cart_item.isbn10)
      )
    limit 1
    for update;

    if found then
      -- Safe Increment: User already owns this exact edition
      update public.library_items
      set
        quantity = quantity + v_qty,
        updated_at = now()
      where id = v_existing_lib_item.id;

      v_existing_lib_id := v_existing_lib_item.id;
      v_target_lib_id := v_existing_lib_item.id;
    end if;
  end if;

  -- 4. If not existing in library, create new library_items row
  if v_target_lib_id is null then
    v_new_book_code := 'BG-' || upper(substr(md5(random()::text), 1, 6));

    insert into public.library_items (
      user_id,
      book_code,
      title,
      normalized_title,
      author,
      normalized_author,
      isbn10,
      isbn13,
      publisher,
      edition,
      published_year,
      cover_url,
      quantity,
      purchase_price,
      purchase_date,
      purchase_place,
      notes
    ) values (
      v_user_id,
      v_new_book_code,
      v_cart_item.title,
      lower(trim(regexp_replace(v_cart_item.title, '[^\w\s]', '', 'g'))),
      v_cart_item.author,
      case when v_cart_item.author is not null
        then lower(trim(regexp_replace(v_cart_item.author, '[^\w\s]', '', 'g')))
        else null
      end,
      v_cart_item.isbn10,
      v_cart_item.isbn13,
      v_cart_item.publisher,
      v_cart_item.edition,
      v_cart_item.published_year,
      v_cart_item.cover_url,
      v_qty,
      v_unit_price,
      coalesce(p_purchase_date, current_date),
      coalesce(p_seller, v_cart_item.seller),
      coalesce(p_notes, v_cart_item.notes)
    )
    returning id into v_target_lib_id;
  end if;

  -- 5. Create immutable snapshot in purchase_history
  insert into public.purchase_history (
    user_id,
    library_item_id,
    title,
    author,
    isbn10,
    isbn13,
    edition,
    cover_url,
    quantity,
    price,
    seller,
    purchase_date,
    total_amount,
    notes
  ) values (
    v_user_id,
    v_target_lib_id,
    v_cart_item.title,
    v_cart_item.author,
    v_cart_item.isbn10,
    v_cart_item.isbn13,
    v_cart_item.edition,
    v_cart_item.cover_url,
    v_qty,
    v_unit_price,
    coalesce(p_seller, v_cart_item.seller),
    coalesce(p_purchase_date, current_date),
    v_total,
    coalesce(p_notes, v_cart_item.notes)
  )
  returning id into v_purchase_history_id;

  -- 6. Remove cart item
  delete from public.cart_items
  where id = p_cart_item_id and user_id = v_user_id;

  -- 7. Remove any matching item in wishlist if same ISBN exists
  if v_cart_item.isbn13 is not null or v_cart_item.isbn10 is not null then
    delete from public.wishlist_items
    where user_id = v_user_id
      and (
        (v_cart_item.isbn13 is not null and isbn13 = v_cart_item.isbn13)
        or (v_cart_item.isbn10 is not null and isbn10 = v_cart_item.isbn10)
      );
  end if;

  return jsonb_build_object(
    'success', true,
    'library_item_id', v_target_lib_id,
    'purchase_history_id', v_purchase_history_id,
    'is_existing_copy', (v_existing_lib_id is not null)
  );
end;
$$;
