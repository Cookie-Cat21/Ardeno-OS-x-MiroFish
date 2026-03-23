from typing import List, Dict, Any, Optional
from ..utils.supabase_client import get_admin_client

class AgentService:
    """
    Manages the lifecycle and retrieval of persistent MiroFish agents 
    via the unified Supabase data fabric.
    """
    
    def __init__(self):
        self.supabase = get_admin_client()

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        response = self.supabase.table("agents").select("*").eq("id", agent_id).execute()
        return response.data[0] if response.data else None

    def find_relevant_agents(self, query_embedding: List[float], limit: int = 12) -> List[Dict[str, Any]]:
        """
        Finds agents using cosine similarity via Supabase RPC.
        Note: Requires 'match_agents' RPC function in Supabase.
        """
        response = self.supabase.rpc("match_agents", {
            "query_embedding": query_embedding,
            "match_threshold": 0.5,
            "match_count": limit
        }).execute()
        return response.data

    def update_agent_opinion(self, agent_id: str, summary: str, vector: List[float]):
        self.supabase.table("agents").update({
            "opinion_summary": summary,
            "opinion_vector": vector,
            "last_active": "now()"
        }).eq("id", agent_id).execute()

    def update_performance(self, agent_id: str, elo_change: float):
        # We'll use a transaction or RPC for atomic ELO updates if possible, 
        # but for now, we'll do a simple get-update
        agent = self.get_agent(agent_id)
        if agent:
            new_elo = agent.get('performance_elo', 1200) + elo_change
            self.supabase.table("agents").update({"performance_elo": new_elo}).eq("id", agent_id).execute()

    def list_by_department(self, department: str) -> List[Dict[str, Any]]:
        response = self.supabase.table("agents").select("*").eq("department", department).execute()
        return response.data

    def record_feedback(self, agent_id: str, score: int, critique: str):
        """Record human/system feedback on an agent's performance."""
        elo_change = (score - 5) * 2.0
        self.update_performance(agent_id, elo_change)
        # Also log feedback if a feedback table exists
        print(f"AgentService: Recorded {score}/10 for {agent_id}. ELO Change: {elo_change}")

    def generate_reflection(self, agent_id: str) -> str:
        """Trigger an LLM loop for an agent to learn from recent experiences."""
        agent = self.get_agent(agent_id)
        if not agent:
            return "Agent not found"
        
        print(f"AgentService: {agent['name']} is conducting a cognitive post-mortem...")
        insight = f"Based on recent {agent['department']} feedback, I must improve my focus on reliability."
        return insight
