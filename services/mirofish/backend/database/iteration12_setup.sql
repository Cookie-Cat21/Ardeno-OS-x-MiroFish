-- ARDENO OS - ITERATION 12 SETUP
-- Enabling Global Budget Guards, Audit Logging, and GitHub Sync

-- 1. BUDGET USAGE TRACKING
CREATE TABLE IF NOT EXISTS public.budget_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE DEFAULT CURRENT_DATE,
    groq_tokens_used BIGINT DEFAULT 0,
    gemini_requests_used INTEGER DEFAULT 0,
    reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + 1)::TIMESTAMPTZ
);

-- 2. AUDIT LOGGING (EDGE & SYSTEM)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    severity TEXT DEFAULT 'info', -- info, warning, error, critical
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. GITHUB COMMITS (WEBHOOK SYNC)
CREATE TABLE IF NOT EXISTS public.github_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id),
    repo_full_name TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    author_name TEXT,
    author_avatar TEXT,
    message TEXT,
    branch TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(repo_full_name, commit_sha)
);

-- 4. ENABLE RLS
ALTER TABLE public.budget_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_commits ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
DO $$
BEGIN
    -- Budget Usage: Read-only for authenticated users, full access for service_role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_usage' AND policyname = 'Everyone can view budget status') THEN
        CREATE POLICY "Everyone can view budget status" ON public.budget_usage FOR SELECT TO authenticated USING (true);
    END IF;

    -- Audit Logs: Only system/admins can view
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs') THEN
        CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND (raw_user_meta_data->>'is_admin')::boolean = true)
        );
    END IF;

    -- GitHub Commits: Everyone can view
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'github_commits' AND policyname = 'Everyone can view commits') THEN
        CREATE POLICY "Everyone can view commits" ON public.github_commits FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 6. FUNCTIONS & TRIGGERS
-- Automatic daily reset trigger or cron suggestion:
-- Every day at midnight UTC: UPDATE budget_usage SET groq_tokens_used = 0, gemini_requests_used = 0, date = CURRENT_DATE, reset_at = (CURRENT_DATE + 1)::TIMESTAMPTZ;

-- 7. INITIAL DATA
INSERT INTO public.budget_usage (date) VALUES (CURRENT_DATE) ON CONFLICT (date) DO NOTHING;
