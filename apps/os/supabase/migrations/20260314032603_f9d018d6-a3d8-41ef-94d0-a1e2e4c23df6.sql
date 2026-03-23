
CREATE TABLE public.custom_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'automation',
  icon TEXT NOT NULL DEFAULT 'Wrench',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_by_orchestrator BOOLEAN NOT NULL DEFAULT false,
  parameters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage custom_skills"
  ON public.custom_skills
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
