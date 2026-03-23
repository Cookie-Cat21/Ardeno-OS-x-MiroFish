-- MiroFish Phase 3: Persistent Society Schema
-- Supports 300-800 autonomous agents with vector memory

-- Enable Vector for Personality and Memory
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Hierarchy (Reference only, implemented as TEXT for flexibility)
-- Departments: 'Commercial & Growth', 'Design & Identity', 'Development & Engineering', 
-- 'Operations & Portal', 'Analytics & Research', 'Security & Compliance', 
-- 'Finance & Legal', 'Localization & Accessibility', 'Innovation & R&D'

-- 2. Agents Table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    personality_embedding vector(1536), -- Matching OpenAI text-embedding-ada-002
    personality_prompt_template TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    opinion_summary TEXT, -- Natural language summary of current stance
    opinion_vector vector(1536),
    performance_elo NUMERIC DEFAULT 1200,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for personality similarity searches
CREATE INDEX ON agents USING ivfflat (personality_embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Memory Table
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    simulation_id UUID,
    content TEXT NOT NULL,
    embedding vector(1536),
    memory_type TEXT DEFAULT 'episodic', -- 'episodic', 'semantic', 'summary'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for RAG retrieval
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Simulation Calls (Foresight Reports)
CREATE TABLE IF NOT EXISTS mirofish_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    result JSONB, -- Final structured Foresight output
    cost_tokens_in INT,
    cost_tokens_out INT,
    cost_usd NUMERIC(10, 5),
    triggered_by UUID, -- Reference to Ardeno agent or human
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skills Usage & Impact
CREATE TABLE IF NOT EXISTS skills_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name TEXT NOT NULL,
    agent_id UUID REFERENCES agents(id),
    usage_count INT DEFAULT 0,
    success_rate NUMERIC(3, 2) DEFAULT 0.5,
    last_used TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Foresight Inbox (Asynchronous Triggers)
CREATE TABLE IF NOT EXISTS foresight_inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_source TEXT, -- 'github', 'news', 'internal_project'
    signal_content TEXT,
    priority_score INT, -- 0-100 from Trigger Evaluator
    status TEXT DEFAULT 'queued', -- 'queued', 'processed', 'ignored'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Feedback & Calibration
CREATE TABLE IF NOT EXISTS feedback_calibration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES mirofish_calls(id),
    real_world_outcome TEXT,
    prediction_error NUMERIC(3, 2), -- 0.0 to 1.0
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
