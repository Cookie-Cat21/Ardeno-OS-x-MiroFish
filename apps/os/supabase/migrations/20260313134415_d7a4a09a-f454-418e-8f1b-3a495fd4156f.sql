
-- Table to track every skill execution
CREATE TABLE public.skill_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id text NOT NULL,
  skill_name text NOT NULL,
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  execution_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skill_executions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can manage skill_executions"
  ON public.skill_executions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Table to track auto-disabled skills
CREATE TABLE public.skill_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  auto_disabled boolean NOT NULL DEFAULT false,
  disabled_reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage skill_overrides"
  ON public.skill_overrides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
