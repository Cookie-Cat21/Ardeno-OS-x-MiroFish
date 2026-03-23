-- ============================================================
-- ARDENO OS – ITERATION 6 MIGRATION
-- Run AFTER iteration4.sql in Supabase SQL Editor
-- ============================================================

-- ─── Add moodboard_url to projects ───────────────────────────
alter table public.projects
  add column if not exists moodboard_url text;

-- ─── User profiles table (for preferred_language etc.) ───────
create table if not exists public.profiles (
  id                 uuid primary key references auth.users on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'si')),
  display_name       text,
  avatar_url         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create or replace function public.set_profile_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_profile_updated();

alter table public.profiles enable row level security;
create policy "profiles_self_read"   on public.profiles for select  to authenticated using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert  to authenticated with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update  to authenticated using (auth.uid() = id);

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, preferred_language)
  values (new.id, 'en')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Add rollback support to audit_logs ──────────────────────
-- Store previous state so we can undo the last action
alter table public.audit_logs
  add column if not exists previous_state jsonb default null,
  add column if not exists rolled_back    boolean not null default false;
