
-- Dashboard layouts table for persisting user widget order
CREATE TABLE public.dashboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_order JSONB NOT NULL DEFAULT '["metrics","revenue","pipeline","tasks","invoices","quickActions","agents","activity"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one layout per user
ALTER TABLE public.dashboard_layouts ADD CONSTRAINT dashboard_layouts_user_id_unique UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own layout
CREATE POLICY "Users can manage own layout" ON public.dashboard_layouts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime on notification_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_log;
