-- ==============================================================================
-- Migration: Community ISBN Metadata Lookup
-- Purpose: When a user scans an ISBN not in their shelf, lookup bibliographic 
-- metadata entered by other BookGuard users to auto-fill book details.
-- Excludes all private/user data (no prices, notes, user IDs, or book codes).
-- ==============================================================================

create or replace function public.lookup_community_book_by_isbn(p_isbn text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_code text;
  book record;
begin
  clean_code := trim(p_isbn);
  if clean_code = '' then
    return null;
  end if;

  select
    title,
    author,
    publisher,
    edition,
    published_year,
    language,
    category,
    cover_url,
    cover_hash,
    isbn13,
    isbn10
  into book
  from public.library_items
  where (isbn13 = clean_code or isbn10 = clean_code or barcode = clean_code)
    and title is not null
    and trim(title) <> ''
  order by
    -- Prioritize records with more complete metadata
    (case when cover_url is not null and trim(cover_url) <> '' then 3 else 0 end +
     case when author is not null and trim(author) <> '' then 2 else 0 end +
     case when publisher is not null and trim(publisher) <> '' then 1 else 0 end +
     case when published_year is not null then 1 else 0 end) desc,
    created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  return json_build_object(
    'found', true,
    'title', book.title,
    'author', book.author,
    'publisher', book.publisher,
    'edition', book.edition,
    'published_year', book.published_year,
    'language', book.language,
    'category', book.category,
    'cover_url', book.cover_url,
    'cover_hash', book.cover_hash,
    'isbn13', book.isbn13,
    'isbn10', book.isbn10
  );
end;
$$;

grant execute on function public.lookup_community_book_by_isbn(text) to authenticated, anon;
