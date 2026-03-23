-- DISCORD INTEGRATION SETUP
-- This script sets up the necessary tables for mapping MiroFish agents and simulations to Discord threads.

-- 1. DISCORD THREADS MAPPING
-- Maps a MiroFish agent or a specific simulation project to a Discord thread.
CREATE TABLE IF NOT EXISTS public.discord_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT, -- Relation to projects table
    agent_id TEXT,   -- Relation to agents table
    channel_id TEXT NOT NULL,
    thread_id TEXT NOT NULL UNIQUE,
    thread_type TEXT NOT NULL, -- 'agent_persistent' or 'simulation_discussion'
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DISCORD COMMUNICATION LOGS
-- Audit trail for all interactions between MiroFish and Discord.
CREATE TABLE IF NOT EXISTS public.mirofish_discord_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id TEXT,
    agent_id TEXT,
    user_id TEXT, -- Discord user ID if applicable
    content TEXT,
    direction TEXT NOT NULL, -- 'to_discord' or 'from_discord'
    message_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.discord_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mirofish_discord_logs ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
DO $$
BEGIN
    -- Threads Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discord_threads' AND policyname = 'Admins can manage discord threads') THEN
        CREATE POLICY "Admins can manage discord threads" ON public.discord_threads FOR ALL TO authenticated USING (true);
    END IF;
    
    -- Logs Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mirofish_discord_logs' AND policyname = 'Admins can view discord logs') THEN
        CREATE POLICY "Admins can view discord logs" ON public.mirofish_discord_logs FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 5. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_discord_threads_project ON public.discord_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_discord_threads_agent ON public.discord_threads(agent_id);
CREATE INDEX IF NOT EXISTS idx_discord_logs_thread ON public.mirofish_discord_logs(thread_id);
