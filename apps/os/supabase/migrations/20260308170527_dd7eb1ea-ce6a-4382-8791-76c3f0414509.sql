
CREATE TABLE public.agent_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  provider text NOT NULL DEFAULT 'gemini',
  model text,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage agent_usage"
  ON public.agent_usage
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
