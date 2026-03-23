
CREATE TABLE public.custom_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'openrouter',
  model text NOT NULL DEFAULT 'deepseek/deepseek-r1:free',
  system_prompt text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage custom_agents"
  ON public.custom_agents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
