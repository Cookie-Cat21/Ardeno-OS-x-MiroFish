
-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  project_type text,
  brief text,
  status text DEFAULT 'Discovery',
  deadline date,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- Project notes table
CREATE TABLE public.project_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage notes" ON public.project_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status text DEFAULT 'To Do',
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agent conversations table
CREATE TABLE public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage conversations" ON public.agent_conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orchestrator results table
CREATE TABLE public.orchestrator_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  task_input text NOT NULL,
  context_input text,
  plan_summary text,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.orchestrator_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage orchestrator results" ON public.orchestrator_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
