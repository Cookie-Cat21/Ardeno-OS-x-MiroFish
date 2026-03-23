
-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  industry text,
  country text DEFAULT 'Sri Lanka',
  health_score integer DEFAULT 50,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Brand kits table
CREATE TABLE public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  colors jsonb DEFAULT '[]'::jsonb,
  fonts jsonb DEFAULT '[]'::jsonb,
  logo_url text,
  tone_of_voice text,
  target_audience text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage brand_kits" ON public.brand_kits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  url text,
  industry text,
  city text,
  country text,
  score integer,
  status text DEFAULT 'New',
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pipeline deals table
CREATE TABLE public.pipeline_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  stage text DEFAULT 'New Lead',
  value numeric,
  last_contact date,
  next_action text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pipeline_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pipeline_deals" ON public.pipeline_deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Website audits table
CREATE TABLE public.website_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  scores jsonb,
  findings jsonb,
  recommendations jsonb,
  overall_score integer,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.website_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage website_audits" ON public.website_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Time logs table
CREATE TABLE public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  logged_by text,
  hours numeric,
  description text,
  logged_at timestamptz DEFAULT now()
);
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage time_logs" ON public.time_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prompts library table
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text,
  category text,
  variables jsonb DEFAULT '[]'::jsonb,
  agent_id text,
  use_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage prompts" ON public.prompts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agent ratings table
CREATE TABLE public.agent_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text,
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  rating integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agent_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage agent_ratings" ON public.agent_ratings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Daily briefings table
CREATE TABLE public.daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content jsonb,
  generated_at timestamptz DEFAULT now()
);
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view briefings" ON public.daily_briefings FOR SELECT TO authenticated USING (true);

-- Add priority column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';

-- Add value and client_id to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS value numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hours_logged numeric DEFAULT 0;
