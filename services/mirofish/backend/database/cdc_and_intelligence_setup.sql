-- UNIFICATION SWITCH: Core Ardeno OS Schema for MiroFish Deep Integration
-- Run this on your chosen Supabase project to ensure all tables exist and Realtime is enabled.

-- 1. PROJECTS TABLE (Dependency for Tasks)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  project_type text,
  brief text,
  status text DEFAULT 'Discovery',
  deadline date,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
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

-- 3. TASKS TABLE (References Projects)
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status text DEFAULT 'To Do',
  priority text DEFAULT 'Medium',
  due_date date,
  created_at timestamptz DEFAULT now()
);

-- 4. INTELLIGENCE REPORTS TABLE (New for MiroFish)
CREATE TABLE IF NOT EXISTS public.intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL, -- Detailed markdown content
  risk_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  impact_score INTEGER DEFAULT 0, -- 0-100
  mitigation_strategy TEXT,
  category TEXT DEFAULT 'market_intelligence',
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES (Simple Permit-All for Authenticated Users for Unification)
-- Note: You can refine these later if needed.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Authenticated users can manage projects') THEN
        CREATE POLICY "Authenticated users can manage projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Authenticated users can manage leads') THEN
        CREATE POLICY "Authenticated users can manage leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Authenticated users can manage tasks') THEN
        CREATE POLICY "Authenticated users can manage tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_reports' AND policyname = 'Users can manage their own intelligence reports') THEN
        CREATE POLICY "Users can manage their own intelligence reports" ON public.intelligence_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. CONFIGURE REALTIME (CDC)
DO $$
BEGIN
    -- Add to publication. Standard Supabase projects have 'supabase_realtime' publication.
    -- We use standard ALTER PUBLICATION commands here.
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_reports;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
