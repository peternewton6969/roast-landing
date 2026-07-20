-- Roast'n Rake landing — Supabase schema, RLS, realtime, RPCs, and seed content.
-- Idempotent: safe to re-run in the Supabase SQL editor. If you ran an earlier
-- version, re-run this whole file to add the likes/dislikes/source columns and the
-- increment RPCs.

create extension if not exists "pgcrypto";

-- =========================================================================
-- roasts: anyone can read the feed and submit a roast (no auth).
-- =========================================================================
create table if not exists public.roasts (
  id         uuid primary key default gen_random_uuid(),
  content    text not null,
  verdict    text not null,
  created_at timestamptz not null default now()
);

-- Feed-engagement columns (added after v1; ADD IF NOT EXISTS so re-runs are safe).
alter table public.roasts add column if not exists likes    integer not null default 0;
alter table public.roasts add column if not exists dislikes integer not null default 0;
alter table public.roasts add column if not exists source   text    not null default 'user'; -- 'seed' | 'user'

alter table public.roasts enable row level security;

drop policy if exists "roasts_public_read" on public.roasts;
create policy "roasts_public_read" on public.roasts
  for select using (true);

drop policy if exists "roasts_public_insert" on public.roasts;
create policy "roasts_public_insert" on public.roasts
  for insert with check (true);
-- NOTE: no public UPDATE policy. Likes/dislikes change only through the SECURITY
-- DEFINER RPCs below, so anon can increment counts but cannot set arbitrary values
-- or edit content.

-- =========================================================================
-- Anonymous like / dislike — atomic increment via RPC (bypasses RLS safely).
-- =========================================================================
create or replace function public.increment_like(roast_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.roasts set likes = likes + 1 where id = roast_id;
$$;

create or replace function public.increment_dislike(roast_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.roasts set dislikes = dislikes + 1 where id = roast_id;
$$;

grant execute on function public.increment_like(uuid) to anon, authenticated;
grant execute on function public.increment_dislike(uuid) to anon, authenticated;

-- =========================================================================
-- waitlist: anyone can insert; NOBODY can read via the anon key (no select
-- policy) — the email/phone list stays private. Admin reads via the dashboard.
-- =========================================================================
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  phone      text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "waitlist_public_insert" on public.waitlist;
create policy "waitlist_public_insert" on public.waitlist
  for insert with check (true);

-- =========================================================================
-- Table grants for the anon role. RLS controls WHICH rows; these grant the role
-- access to the tables at all. (Supabase does not always auto-grant these — a
-- missing grant surfaces as "42501 permission denied" / HTTP 401.)
-- =========================================================================
grant usage on schema public to anon, authenticated;
grant select, insert on public.roasts to anon, authenticated;
grant insert on public.waitlist to anon, authenticated;

-- =========================================================================
-- Realtime: broadcast INSERT + UPDATE on roasts so new roasts AND live like/
-- dislike counts update across sessions without polling.
-- (Safe to re-run — ignore "already member of publication" if it appears.)
-- =========================================================================
do $$
begin
  alter publication supabase_realtime add table public.roasts;
exception
  when duplicate_object then null;
end $$;
-- Include the full row on UPDATE so the realtime payload carries new like counts.
alter table public.roasts replica identity full;

-- =========================================================================
-- Seed content: source='seed' with pre-loaded likes so the feed feels alive on
-- first visit. Insert-if-missing, then normalize (idempotent across re-runs).
-- =========================================================================
insert into public.roasts (content, verdict, source, likes)
select 'You putt like old people fuck.', 'BRUTAL', 'seed', 47
where not exists (select 1 from public.roasts where content = 'You putt like old people fuck.');

insert into public.roasts (content, verdict, source, likes)
select 'Your mother''s adopted.', 'CERTIFIED', 'seed', 88
where not exists (select 1 from public.roasts where content = 'Your mother''s adopted.');

insert into public.roasts (content, verdict, source, likes)
select 'Your handicap is not a handicap. It''s a cry for help.', 'FIRE', 'seed', 71
where not exists (select 1 from public.roasts where content = 'Your handicap is not a handicap. It''s a cry for help.');

update public.roasts set source = 'seed', likes = greatest(likes, 47)
  where content = 'You putt like old people fuck.';
update public.roasts set source = 'seed', likes = greatest(likes, 88)
  where content = 'Your mother''s adopted.';
update public.roasts set source = 'seed', likes = greatest(likes, 71)
  where content = 'Your handicap is not a handicap. It''s a cry for help.';
