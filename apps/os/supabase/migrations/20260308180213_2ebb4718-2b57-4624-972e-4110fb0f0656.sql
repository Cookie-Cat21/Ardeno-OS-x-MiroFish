
-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  items JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client intake submissions (public, no auth needed)
CREATE TABLE public.intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  industry TEXT,
  website_url TEXT,
  project_type TEXT,
  budget_range TEXT,
  timeline TEXT,
  description TEXT,
  status TEXT DEFAULT 'New',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
-- Public insert for intake form (no auth required)
CREATE POLICY "Anyone can submit intake" ON public.intake_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can manage intake" ON public.intake_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notification preferences
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage notifications" ON public.notification_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add share_token to projects for public status page
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS public_updates JSONB DEFAULT '[]';
