-- ============================================================
-- ARDENO OS – ITERATION 8 MIGRATION
-- Run after iteration6.sql in Supabase SQL Editor
-- ============================================================

-- ─── User Roles ───────────────────────────────────────────────
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  role    text not null default 'user'
            check (role in ('user', 'admin')),
  set_by  uuid references auth.users on delete set null,
  set_at  timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Anyone authenticated can read their own role
create policy "roles_self_read" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- Admin can read all roles (use service role in edge function, or RPC)
create policy "roles_admin_read" on public.user_roles
  for select to authenticated using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  );

-- Only admins can insert/update roles
create policy "roles_admin_write" on public.user_roles
  for all to authenticated using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  );

-- ─── Update projects RLS: admins see ALL projects ─────────────
-- Drop existing select policy and replace with admin-aware version
drop policy if exists "projects_select" on public.projects;

create policy "projects_select" on public.projects
  for select to authenticated using (
    auth.uid() = user_id
    OR exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  );

-- ─── Security Scans table ─────────────────────────────────────
create table if not exists public.security_scans (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references public.projects on delete cascade not null,
  scan_timestamp timestamptz not null default now(),
  vulns_found    integer not null default 0,
  details        jsonb not null default '[]',
  risk_delta     numeric(5,2) not null default 0,
  user_id        uuid references auth.users on delete set null
);

alter table public.security_scans enable row level security;

create policy "scans_select" on public.security_scans
  for select to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (
        p.user_id = auth.uid()
        or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
      )
    )
  );

create policy "scans_insert" on public.security_scans
  for insert to authenticated with check (true);

-- ─── Skill Usages (granular tracking) ────────────────────────
create table if not exists public.skill_usages (
  id         uuid primary key default gen_random_uuid(),
  skill_id   uuid references public.skills on delete cascade not null,
  project_id uuid references public.projects on delete cascade,
  agent_name text,
  bonus_pts  numeric(4,2) not null default 0,
  used_at    timestamptz not null default now()
);

alter table public.skill_usages enable row level security;
create policy "skill_usages_read"   on public.skill_usages for select to authenticated using (true);
create policy "skill_usages_insert" on public.skill_usages for insert to authenticated with check (true);

-- ─── Seed first admin (replace with your actual user UUID) ────
-- Run this manually after first login:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<your-user-id>', 'admin');

-- ─── RPC: get user role ───────────────────────────────────────
create or replace function public.get_my_role()
returns text language sql security definer as $$
  select coalesce(
    (select role from public.user_roles where user_id = auth.uid()),
    'user'
  );
$$;
