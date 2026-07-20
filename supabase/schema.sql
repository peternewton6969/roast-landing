-- Roast'n Rake landing — Supabase schema, RLS, realtime, and seed content.
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

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

alter table public.roasts enable row level security;

drop policy if exists "roasts_public_read" on public.roasts;
create policy "roasts_public_read" on public.roasts
  for select using (true);

drop policy if exists "roasts_public_insert" on public.roasts;
create policy "roasts_public_insert" on public.roasts
  for insert with check (true);

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
-- Realtime: broadcast INSERTs on roasts so the feed updates live.
-- (Safe to re-run — ignore "already member of publication" if it appears.)
-- =========================================================================
do $$
begin
  alter publication supabase_realtime add table public.roasts;
exception
  when duplicate_object then null;
end $$;

-- =========================================================================
-- Seed content (run once). Uses '' to escape apostrophes.
-- =========================================================================
insert into public.roasts (content, verdict) values
  ('You putt like old people fuck.', 'BRUTAL'),
  ('Your mother''s adopted.', 'CERTIFIED'),
  ('Your handicap is not a handicap. It''s a cry for help.', 'FIRE');
