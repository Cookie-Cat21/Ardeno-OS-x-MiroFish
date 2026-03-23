-- ============================================================
-- ARDENO OS – ITERATION 4 MIGRATION
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── Drop and recreate projects ─────────────────────────────
drop table if exists public.audit_logs cascade;
drop table if exists public.agent_reviews cascade;
drop table if exists public.skills cascade;
drop table if exists public.projects cascade;

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  title           text not null,
  description     text,
  stage           text not null default 'Intake'
                    check (stage in ('Intake','Quote','Design','Build','Security','Deploy','Done')),
  consensus_score numeric(5,2) not null default 75 check (consensus_score between 0 and 100),
  risk_score      numeric(5,2) not null default 25  check (risk_score      between 0 and 100),
  github_branch   text,
  budget          numeric(12,2),
  deadline        date,
  user_id         uuid references auth.users on delete cascade not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

alter table public.projects enable row level security;
create policy "projects_select" on public.projects for select to authenticated using (auth.uid() = user_id);
create policy "projects_insert" on public.projects for insert to authenticated with check (auth.uid() = user_id);
create policy "projects_update" on public.projects for update to authenticated using (auth.uid() = user_id);
create policy "projects_delete" on public.projects for delete to authenticated using (auth.uid() = user_id);

-- ─── Agent Reviews ───────────────────────────────────────────
create table public.agent_reviews (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects on delete cascade not null,
  agent_name  text not null,
  score       numeric(5,2) not null check (score between 0 and 100),
  weight      numeric(3,2) not null default 1.0,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.agent_reviews enable row level security;
create policy "reviews_select" on public.agent_reviews for select to authenticated using (true);
create policy "reviews_insert" on public.agent_reviews for insert to authenticated with check (true);

-- ─── Skills ──────────────────────────────────────────────────
create table public.skills (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,
  description  text,
  category     text not null default 'General'
                 check (category in ('Frontend','Backend','Security','Localization','DevOps','Design','General')),
  success_rate numeric(5,2) not null default 85 check (success_rate between 0 and 100),
  usage_count  integer not null default 0,
  version      text not null default 'v1.0',
  last_updated timestamptz not null default now(),
  created_by   uuid references auth.users on delete set null,
  created_at   timestamptz not null default now()
);

create or replace function public.set_skill_updated()
returns trigger language plpgsql as $$
begin new.last_updated = now(); return new; end; $$;

create trigger skills_updated_at
  before update on public.skills
  for each row execute procedure public.set_skill_updated();

alter table public.skills enable row level security;
create policy "skills_read"   on public.skills for select to authenticated using (true);
create policy "skills_insert" on public.skills for insert to authenticated with check (auth.uid() = created_by);
create policy "skills_update" on public.skills for update to authenticated using (auth.uid() = created_by);

-- Usage counter helper (called from frontend as fallback)
create or replace function public.increment_skill_usage(skill_id uuid)
returns void language sql as $$
  update public.skills set usage_count = usage_count + 1 where id = skill_id;
$$;

-- ─── Audit Logs ──────────────────────────────────────────────
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  entity_type text not null default 'project',
  entity_id   uuid,
  meta        jsonb not null default '{}',
  user_id     uuid references auth.users on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create policy "audit_select" on public.audit_logs for select to authenticated using (true);
create policy "audit_insert" on public.audit_logs for insert to authenticated with check (true);

-- ─── Seed Skills ─────────────────────────────────────────────
-- (Adjust created_by to a real user UUID after first login, or remove that column from the insert)
insert into public.skills (name, description, category, success_rate, usage_count, version) values
  ('React SPA Builder',       'Builds performant single-page apps with React + Vite',          'Frontend',     91, 24, 'v3.2'),
  ('Tailwind Stylist',        'Applies design-system-consistent Tailwind utility classes',      'Frontend',     88, 31, 'v2.4'),
  ('Supabase Integrator',     'Sets up Supabase auth, realtime, and RLS policies',             'Backend',      84, 18, 'v2.1'),
  ('Edge Function Deployer',  'Writes and deploys Supabase Deno edge functions',               'Backend',      79, 9,  'v1.3'),
  ('OWASP Auditor',           'Performs OWASP Top-10 audit and produces risk report',          'Security',     76, 12, 'v1.8'),
  ('Sinhala Localizer',       'Translates UI strings to Sinhala and validates typography',     'Localization',  82, 5,  'v1.1'),
  ('CI/CD Pipeline Builder',  'Configures GitHub Actions or Supabase deploy pipelines',        'DevOps',       80, 14, 'v2.0'),
  ('Figma-to-Code',           'Converts Figma designs to pixel-perfect React components',      'Design',       89, 22, 'v3.0'),
  ('PDF Proposal Generator',  'Exports branded project proposals using jsPDF',                 'General',      90, 8,  'v1.5'),
  ('Telegram Bot Commander',  'Manages Telegram bot commands and project notifications',        'General',      85, 6,  'v1.2');
