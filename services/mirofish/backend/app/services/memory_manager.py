import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any
from ..config import Config

class MemoryManager:
    """
    Handles episodic and semantic memory for agents using pgvector.
    """
    
    def __init__(self):
        self.db_url = Config.DATABASE_URL

    def _get_connection(self):
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)

    def store_memory(self, agent_id: str, content: str, embedding: List[float], sim_id: str = None, m_type: str = 'episodic'):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO memories (agent_id, content, embedding, simulation_id, memory_type) "
                    "VALUES (%s, %s, %s::vector, %s, %s)",
                    (agent_id, content, embedding, sim_id, m_type)
                )
                conn.commit()

    def retrieve_context(self, agent_id: str, query_embedding: List[float], limit: int = 8) -> List[str]:
        """
        Retrieves the top N relevant memories for an agent based on vector similarity.
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT content FROM memories "
                    "WHERE agent_id = %s "
                    "ORDER BY embedding <=> %s::vector ASC LIMIT %s",
                    (agent_id, query_embedding, limit)
                )
                return [row['content'] for row in cur.fetchall()]

    def compress_memories(self, agent_id: str):
        """
        Placeholder for the nightly job that summarizes old memories into 'semantic' or 'summary' types
        to prevent vector db bloat and context window overflow.
        """
        # Implementation would involve LLM summarization of episodic memories older than 1 week
        pass
