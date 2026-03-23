-- ============================================================
-- ARDENO OS – ITERATION 9 MIGRATION
-- Agent Memory System
-- Run after iteration8.sql in Supabase SQL Editor
-- ============================================================

-- ─── Agent Memory ─────────────────────────────────────────────────────────────
-- Long-term memory for all catalog agents.
-- Memories are org-wide (shared between all authenticated users).
-- Extracted automatically after each conversation via the agent-chat edge function.

create table if not exists public.agent_memory (
  id            uuid        primary key default gen_random_uuid(),
  agent_id      text        not null,
  memory_type   text        not null default 'client_fact'
                              check (memory_type in ('client_fact', 'preference', 'project_context', 'summary')),
  content       text        not null,
  importance    integer     not null default 5 check (importance between 1 and 10),
  project_id    uuid        references public.projects(id) on delete set null,
  client_name   text,
  created_at    timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  access_count  integer     not null default 0
);

alter table public.agent_memory enable row level security;

-- All authenticated users can read memories (org-wide shared context)
create policy "memory_read" on public.agent_memory
  for select to authenticated using (true);

-- All authenticated users can write memories
create policy "memory_write" on public.agent_memory
  for insert to authenticated with check (true);

-- All authenticated users can update memories
create policy "memory_update" on public.agent_memory
  for update to authenticated using (true);

-- Only service role (edge functions) can delete memories
-- (No delete policy = no deletes from client, only service role key bypasses RLS)

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_agent_memory_agent_id
  on public.agent_memory (agent_id);

create index if not exists idx_agent_memory_importance
  on public.agent_memory (agent_id, importance desc);

create index if not exists idx_agent_memory_last_accessed
  on public.agent_memory (agent_id, last_accessed desc);

-- ─── Helper view: top memories per agent ──────────────────────────────────────
create or replace view public.agent_memory_top as
  select
    agent_id,
    memory_type,
    content,
    importance,
    client_name,
    last_accessed,
    access_count
  from public.agent_memory
  order by importance desc, last_accessed desc;

grant select on public.agent_memory_top to authenticated;
