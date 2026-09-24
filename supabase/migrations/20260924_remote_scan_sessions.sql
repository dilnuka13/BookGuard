-- ==============================================================================
-- Migration: Remote Phone ISBN/Barcode Scanner Sessions
-- Author: BookGuard Engineering
-- Purpose: Temporary, secure sessions allowing phones to act as wireless scanners for PC
-- ==============================================================================

-- 1. Create remote_scan_sessions table
create table if not exists public.remote_scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_token text not null,
  status text not null default 'waiting' check (status in ('waiting', 'connected', 'scanned', 'expired', 'closed')),
  scanned_value text null,
  device_connected boolean not null default false,
  device_info text null,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Performance & Security Indexes
create index if not exists idx_remote_scan_sessions_user on public.remote_scan_sessions(user_id);
create index if not exists idx_remote_scan_sessions_lookup on public.remote_scan_sessions(id, session_token);
create index if not exists idx_remote_scan_sessions_expires on public.remote_scan_sessions(expires_at);

-- 3. Enable Row Level Security (RLS)
alter table public.remote_scan_sessions enable row level security;

-- 4. RLS Policy: Authenticated users can fully manage their own scanner sessions
drop policy if exists "Users can manage own remote scan sessions" on public.remote_scan_sessions;
create policy "Users can manage own remote scan sessions"
  on public.remote_scan_sessions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. RLS Policy: Anonymous clients can view valid unexpired session data only
drop policy if exists "Anon can view valid remote scan session" on public.remote_scan_sessions;
create policy "Anon can view valid remote scan session"
  on public.remote_scan_sessions
  for select
  to anon
  using (expires_at > now() and status <> 'closed');

-- 6. Helper RPC: Verify and retrieve session info without exposing user_id
create or replace function public.get_remote_scan_session(p_session_id uuid, p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  sess record;
begin
  select id, status, device_connected, expires_at, (expires_at < now()) as is_expired
  into sess
  from public.remote_scan_sessions
  where id = p_session_id and session_token = p_token;

  if not found then
    return json_build_object('success', false, 'error', 'Invalid session ID or token');
  end if;

  if sess.is_expired or sess.status = 'closed' or sess.status = 'expired' then
    -- Mark as expired in db if not already
    if sess.status <> 'closed' then
      update public.remote_scan_sessions set status = 'expired', updated_at = now() where id = p_session_id;
    end if;
    return json_build_object('success', false, 'status', sess.status, 'error', 'Session has expired or closed');
  end if;

  return json_build_object(
    'success', true,
    'session_id', sess.id,
    'status', sess.status,
    'device_connected', sess.device_connected,
    'expires_at', sess.expires_at
  );
end;
$$;

-- 7. Helper RPC: Phone connects to session
create or replace function public.connect_remote_scan_session(
  p_session_id uuid,
  p_token text,
  p_device_info text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  sess record;
begin
  select id, status, expires_at
  into sess
  from public.remote_scan_sessions
  where id = p_session_id and session_token = p_token;

  if not found then
    return json_build_object('success', false, 'error', 'Session not found or invalid token');
  end if;

  if sess.expires_at < now() or sess.status = 'closed' or sess.status = 'expired' then
    return json_build_object('success', false, 'error', 'Session expired or closed');
  end if;

  update public.remote_scan_sessions
  set
    status = 'connected',
    device_connected = true,
    device_info = coalesce(p_device_info, device_info),
    updated_at = now()
  where id = p_session_id;

  return json_build_object('success', true, 'status', 'connected');
end;
$$;

-- 8. Helper RPC: Phone submits detected barcode
create or replace function public.submit_remote_scan_barcode(
  p_session_id uuid,
  p_token text,
  p_barcode text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  sess record;
  clean_code text;
begin
  clean_code := trim(p_barcode);
  if clean_code = '' then
    return json_build_object('success', false, 'error', 'Barcode cannot be empty');
  end if;

  select id, status, expires_at
  into sess
  from public.remote_scan_sessions
  where id = p_session_id and session_token = p_token;

  if not found then
    return json_build_object('success', false, 'error', 'Invalid session ID or token');
  end if;

  if sess.expires_at < now() or sess.status = 'closed' or sess.status = 'expired' then
    return json_build_object('success', false, 'error', 'Session has expired or closed');
  end if;

  update public.remote_scan_sessions
  set
    scanned_value = clean_code,
    status = 'scanned',
    updated_at = now()
  where id = p_session_id;

  return json_build_object('success', true, 'scanned_value', clean_code, 'status', 'scanned');
end;
$$;

-- 9. Helper RPC: Phone disconnects
create or replace function public.disconnect_remote_scan_session(
  p_session_id uuid,
  p_token text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.remote_scan_sessions
  set
    status = 'waiting',
    device_connected = false,
    updated_at = now()
  where id = p_session_id and session_token = p_token and status = 'connected';

  return json_build_object('success', true, 'status', 'waiting');
end;
$$;

-- 10. Enable Supabase Realtime on remote_scan_sessions table
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'remote_scan_sessions'
  ) then
    alter publication supabase_realtime add table public.remote_scan_sessions;
  end if;
end;
$$;
