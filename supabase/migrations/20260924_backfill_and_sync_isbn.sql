-- ==============================================================================
-- Migration: Backfill & Bi-Directional Auto-Sync for ISBN-10 and ISBN-13
-- Author: BookGuard Engineering
-- Purpose: Ensures existing and future books always have both ISBN-10 and ISBN-13
-- ==============================================================================

-- 1. Helper function to convert 10-digit ISBN to 13-digit ISBN (978 prefix)
create or replace function public.convert_isbn10_to_isbn13(isbn10 text)
returns text
language plpgsql
immutable
as $$
declare
  clean text;
  core text;
  s integer := 0;
  digit integer;
  check_digit integer;
  i integer;
begin
  if isbn10 is null then return null; end if;
  clean := regexp_replace(isbn10, '[^0-9X]', '', 'g');
  if length(clean) <> 10 then
    return null;
  end if;

  core := '978' || substring(clean from 1 for 9);

  for i in 1..12 loop
    digit := cast(substring(core from i for 1) as integer);
    if i % 2 = 1 then
      s := s + digit;
    else
      s := s + (digit * 3);
    end if;
  end loop;

  check_digit := (10 - (s % 10)) % 10;
  return core || check_digit::text;
end;
$$;

-- 2. Helper function to convert 13-digit ISBN (starting with 978) to 10-digit ISBN
create or replace function public.convert_isbn13_to_isbn10(isbn13 text)
returns text
language plpgsql
immutable
as $$
declare
  clean text;
  core text;
  s integer := 0;
  digit integer;
  rem integer;
  check_char text;
  i integer;
begin
  if isbn13 is null then return null; end if;
  clean := regexp_replace(isbn13, '[^0-9]', '', 'g');
  if length(clean) <> 13 or substring(clean from 1 for 3) <> '978' then
    return null;
  end if;

  core := substring(clean from 4 for 9);

  for i in 1..9 loop
    digit := cast(substring(core from i for 1) as integer);
    s := s + (digit * (10 - i + 1));
  end loop;

  rem := (11 - (s % 11)) % 11;
  if rem = 10 then
    check_char := 'X';
  else
    check_char := rem::text;
  end if;

  return core || check_char;
end;
$$;

-- 3. Automatic Database Trigger Function to keep ISBN-10 and ISBN-13 synced
create or replace function public.sync_library_item_isbns()
returns trigger
language plpgsql
as $$
begin
  -- Auto-derive ISBN-10 if only ISBN-13 is provided
  if (NEW.isbn13 is not null and NEW.isbn13 <> '') and (NEW.isbn10 is null or NEW.isbn10 = '') then
    NEW.isbn10 := public.convert_isbn13_to_isbn10(NEW.isbn13);
  end if;

  -- Auto-derive ISBN-13 if only ISBN-10 is provided
  if (NEW.isbn10 is not null and NEW.isbn10 <> '') and (NEW.isbn13 is null or NEW.isbn13 = '') then
    NEW.isbn13 := public.convert_isbn10_to_isbn13(NEW.isbn10);
  end if;

  return NEW;
end;
$$;

-- 4. Attach trigger to public.library_items
drop trigger if exists trigger_sync_library_item_isbns on public.library_items;
create trigger trigger_sync_library_item_isbns
  before insert or update on public.library_items
  for each row execute function public.sync_library_item_isbns();

-- 5. Backfill all existing rows in database
update public.library_items
set
  isbn10 = coalesce(isbn10, public.convert_isbn13_to_isbn10(isbn13)),
  isbn13 = coalesce(isbn13, public.convert_isbn10_to_isbn13(isbn10))
where (isbn13 is not null and (isbn10 is null or isbn10 = ''))
   or (isbn10 is not null and (isbn13 is null or isbn13 = ''));
