
CREATE TABLE public.generated_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  industry text,
  description text,
  html text,
  design jsonb,
  research text,
  content text,
  pages text[] DEFAULT '{}'::text[],
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.generated_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage generated_websites"
  ON public.generated_websites
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
