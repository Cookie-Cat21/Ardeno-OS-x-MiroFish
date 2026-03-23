
-- Proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  industry TEXT,
  title TEXT NOT NULL,
  pages INTEGER DEFAULT 1,
  features TEXT[] DEFAULT '{}',
  value NUMERIC,
  status TEXT DEFAULT 'Draft',
  result TEXT DEFAULT 'Pending',
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage proposals" ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Outreach logs table
CREATE TABLE public.outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  method TEXT DEFAULT 'email',
  subject TEXT,
  template TEXT,
  body_preview TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  meeting_booked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage outreach_logs" ON public.outreach_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Intelligence snapshots table (stores AI-generated insights)
CREATE TABLE public.intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type TEXT NOT NULL DEFAULT 'full',
  insights JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '[]',
  data_summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.intelligence_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage intelligence_snapshots" ON public.intelligence_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
