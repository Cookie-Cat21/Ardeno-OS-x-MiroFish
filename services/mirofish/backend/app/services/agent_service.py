import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from ..config import Config

class AgentService:
    """
    Manages the lifecycle and retrieval of persistent MiroFish agents.
    """
    
    def __init__(self):
        self.db_url = Config.DATABASE_URL
        if not self.db_url:
            raise ValueError("DATABASE_URL not configured")

    def _get_connection(self):
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM agents WHERE id = %s", (agent_id,))
                return cur.fetchone()

    def find_relevant_agents(self, query_embedding: List[float], limit: int = 12) -> List[Dict[str, Any]]:
        """
        Finds agents whose personalities or roles match the query embedding using cosine similarity.
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT *, (personality_embedding <=> %s::vector) as distance "
                    "FROM agents "
                    "ORDER BY distance ASC LIMIT %s",
                    (query_embedding, limit)
                )
                return cur.fetchall()

    def update_agent_opinion(self, agent_id: str, summary: str, vector: List[float]):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE agents SET opinion_summary = %s, opinion_vector = %s::vector, last_active = NOW() WHERE id = %s",
                    (summary, vector, agent_id)
                )
                conn.commit()

    def update_performance(self, agent_id: str, elo_change: float):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE agents SET performance_elo = performance_elo + %s WHERE id = %s", (elo_change, agent_id))
                conn.commit()

    def list_by_department(self, department: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM agents WHERE department = %s", (department,))
                return cur.fetchall()

    def record_feedback(self, agent_id: str, score: int, critique: str):
        """Record human/system feedback on an agent's performance."""
        # Simple ELO-like update with tracking
        elo_change = (score - 5) * 2.0
        self.update_performance(agent_id, elo_change)
        print(f"AgentService: Recorded {score}/10 for {agent_id}. ELO Change: {elo_change}")

    def generate_reflection(self, agent_id: str) -> str:
        """Trigger an LLM loop for an agent to learn from recent experiences."""
        agent = self.get_agent(agent_id)
        if not agent:
            return "Agent not found"
        
        # This is where the 'Reflection Prompt' would be triggered via LLM
        # For now, we simulate the 'Wisdom Extraction'
        print(f"AgentService: {agent['name']} is conducting a cognitive post-mortem...")
        insight = f"Based on recent {agent['department']} feedback, I must improve my focus on reliability."
        return insight
