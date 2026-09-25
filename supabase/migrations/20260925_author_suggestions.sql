-- ==============================================================================
-- Migration: Author Auto-suggestion & Fast Selection
-- Purpose: When a user adds/edits a book, query authors previously entered by any user
-- across BookGuard so they can quickly select an existing author name.
-- Excludes all private/user data (returns only author string and count).
-- ==============================================================================

create index if not exists idx_library_items_author_lookup 
  on public.library_items(author) 
  where author is not null and trim(author) <> '';

create or replace function public.suggest_authors(
  p_query text default '',
  p_limit integer default 15
)
returns table (
  author text,
  book_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_query text;
begin
  clean_query := trim(coalesce(p_query, ''));

  if clean_query = '' then
    -- Return most popular authors in the system
    return query
    select
      trim(li.author) as author,
      count(*)::bigint as book_count
    from public.library_items li
    where li.author is not null
      and trim(li.author) <> ''
    group by trim(li.author)
    order by count(*) desc, trim(li.author) asc
    limit coalesce(p_limit, 15);
  else
    -- Return matching authors:
    -- Priority 1: Prefix match on author name (starts with query)
    -- Priority 2: Word boundary prefix match
    -- Priority 3: Substring match anywhere or match on normalized_author
    return query
    select
      trim(li.author) as author,
      count(*)::bigint as book_count
    from public.library_items li
    where li.author is not null
      and trim(li.author) <> ''
      and (
        li.author ilike '%' || clean_query || '%'
        or coalesce(li.normalized_author, '') ilike '%' || lower(clean_query) || '%'
      )
    group by trim(li.author)
    order by
      -- Exact prefix matches first
      case when trim(li.author) ilike clean_query || '%' then 0
           when trim(li.author) ilike '% ' || clean_query || '%' then 1
           else 2
      end,
      count(*) desc,
      trim(li.author) asc
    limit coalesce(p_limit, 15);
  end if;
end;
$$;

grant execute on function public.suggest_authors(text, integer) to authenticated, anon;
