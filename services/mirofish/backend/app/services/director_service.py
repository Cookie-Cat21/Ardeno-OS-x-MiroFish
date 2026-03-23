from typing import List, Dict, Any
from .agent_service import AgentService
from ..config import Config

class DirectorService:
    """
    The central intelligence that decomposes user requests into 
    departmental 'Work Orders' (Action Tickets).
    """
    
    def __init__(self):
        self.agent_service = AgentService()

    def decompose_request(self, user_goal: str) -> List[Dict[str, Any]]:
        """
        Uses an LLM (Director profile) to analyze a goal and create a 
        sequenced list of departmental actions.
        """
        # In production: Call LLM with a 'Director' prompt template
        # Mocking the decomposition for now:
        tickets = [
            {
                "id": "T-001",
                "department": "Commercial & Growth",
                "description": f"Analyze market viability for: {user_goal}",
                "priority": "high",
                "status": "pending"
            },
            {
                "id": "T-002",
                "department": "Design & Identity",
                "description": f"Create glassmorphic mockups based on commercial analysis.",
                "depends_on": "T-001",
                "status": "waiting"
            },
            {
                "id": "T-003",
                "department": "Development & Engineering",
                "description": f"Implement the core feature logic in the ardeno-os-core repo.",
                "depends_on": "T-002",
                "status": "waiting"
            }
        ]
        return tickets

    def check_safety(self, ticket: Dict[str, Any]) -> bool:
        """Determines if a ticket requires human veto (e.g., file modification)."""
        high_risk_departments = ["Development & Engineering", "Security & Compliance"]
        return ticket['department'] in high_risk_departments
