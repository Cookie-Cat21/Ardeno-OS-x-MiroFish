import time
from typing import List, Dict, Any
from .director_service import DirectorService

class WorkflowEngine:
    """
    Manages the state and execution of departmental Action Tickets.
    Handles dependencies and triggers departmental 'Workers'.
    """
    
    def __init__(self):
        self.director = DirectorService()
        self.active_workflows: Dict[str, List[Dict[str, Any]]] = {}
        self.event_queues: Dict[str, List[Any]] = {} # project_id -> list of Queues

    def subscribe(self, project_id: str):
        """Returns a queue to listen for project events."""
        import queue
        q = queue.Queue()
        if project_id not in self.event_queues:
            self.event_queues[project_id] = []
        self.event_queues[project_id].append(q)
        return q

    def _broadcast(self, project_id: str, event: Dict[str, Any]):
        """Broadcasts an event to all subscribers of a project."""
        if project_id in self.event_queues:
            for q in self.event_queues[project_id]:
                q.put(event)

    def log_thought(self, project_id: str, agent_id: str, thought: str):
        """Logs a 'thinking' event for real-time telemetry."""
        event = {
            "type": "thought",
            "agent_id": agent_id,
            "content": thought,
            "timestamp": time.time()
        }
        self._broadcast(project_id, event)

    def start_project(self, goal: str) -> str:
        project_id = f"PRJ-{int(time.time())}"
        tickets = self.director.decompose_request(goal)
        self.active_workflows[project_id] = tickets
        
        self._broadcast(project_id, {"type": "project_started", "goal": goal})
        
        # Trigger first ticket
        self._trigger_next_available(project_id)
        return project_id

    def _trigger_next_available(self, project_id: str):
        tickets = self.active_workflows.get(project_id, [])
        for ticket in tickets:
            if ticket['status'] == 'pending':
                # Map department to real worker execution
                print(f"WorkflowEngine: Triggering {ticket['department']} for {ticket['id']}")
                ticket['status'] = 'running'
                
                self._broadcast(project_id, {
                    "type": "ticket_started",
                    "ticket_id": ticket['id'],
                    "department": ticket['department'],
                    "description": ticket['description']
                })
                
                # In execution: call specific department worker service
                # e.g., self.dev_worker.execute(ticket) if dept == 'Development'
                break

    def complete_ticket(self, project_id: str, ticket_id: str, result: Any):
        tickets = self.active_workflows.get(project_id, [])
        for ticket in tickets:
            if ticket['id'] == ticket_id:
                ticket['status'] = 'completed'
                ticket['result'] = result
                
                self._broadcast(project_id, {
                    "type": "ticket_completed",
                    "ticket_id": ticket_id,
                    "result": result
                })
                break
        
        # Check if dependants can now run
        for ticket in tickets:
            if ticket['status'] == 'waiting' and ticket.get('depends_on') == ticket_id:
                ticket['status'] = 'pending'
        
        self._trigger_next_available(project_id)

    def get_project_status(self, project_id: str):
        return self.active_workflows.get(project_id, [])
