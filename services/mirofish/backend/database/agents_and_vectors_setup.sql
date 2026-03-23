-- AGENTS AND VECTOR INTELLIGENCE SETUP
-- Enables the 300+ MiroFish agents to live natively in Supabase with vector search.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY, -- Using TEXT as IDs are often readable like 'dev-01'
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT,
  personality_summary TEXT,
  opinion_summary TEXT,
  performance_elo DOUBLE PRECISION DEFAULT 1200.0,
  last_active TIMESTAMPTZ DEFAULT now(),
  
  -- Vector Columns (Requires pgvector)
  personality_embedding vector(1536), -- Assuming OpenAI embeddings
  opinion_vector vector(1536),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Anyone can view agents') THEN
        CREATE POLICY "Anyone can view agents" ON public.agents FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Admins can manage agents') THEN
        CREATE POLICY "Admins can manage agents" ON public.agents FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. VECTOR SEARCH RPC
CREATE OR REPLACE FUNCTION match_agents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  department TEXT,
  role TEXT,
  personality_summary TEXT,
  performance_elo DOUBLE PRECISION,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    agents.id,
    agents.name,
    agents.department,
    agents.role,
    agents.personality_summary,
    agents.performance_elo,
    1 - (agents.personality_embedding <=> query_embedding) AS similarity
  FROM agents
  WHERE 1 - (agents.personality_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
