import random
import json
from typing import List, Dict, Any
from .agent_service import AgentService
from .memory_manager import MemoryManager
from .cost_guard import CostGuard
from .data_ingest_service import DataIngestService
from ..config import Config

class SimulationOrchestrator:
    """
    The 'Brain' of MiroFish Phase 3.
    Orchestrates the society of agents to generate high-fidelity foresight.
    """
    
    def __init__(self):
        self.agent_service = AgentService()
        self.memory_manager = MemoryManager()
        self.cost_guard = CostGuard()
        self.data_ingest = DataIngestService()

    def run_strategic_session(self, query: str, simulation_id: str):
        # 1. Fetch live market grounding context
        signals = self.data_ingest.fetch_global_signals()
        live_context = self.data_ingest.summarize_context(signals)
        print(f"Orchestrator: Grounding simulation in live context: {live_context[:100]}...")

        # 2. Select relevant agents (Society selection)
        # In Phase 3, we select a mix from 9 departments based on the query.
        selected_agents = self.agent_service.find_relevant_agents([], limit=10)
        
        discussion_logs = []
        
        # 2. Iterate through discussion rounds
        for round_num in range(1, 4): # Max 3 rounds
            for agent in selected_agents:
                # Check budget
                allowed, reason = self.cost_guard.can_proceed(agent['department'])
                if not allowed:
                    continue
                
                # RAG: Retrieve context
                context = self.memory_manager.retrieve_context(agent['id'], []) # Vector search logic
                
                # Construct dynamic prompt
                # (Actual LLM call logic would be here)
                
                # Simulated response for now
                response_text = f"Discussion from {agent['name']} ({agent['role']}) in round {round_num}."
                
                discussion_logs.append({
                    "agent": agent['name'],
                    "department": agent['department'],
                    "text": response_text
                })
        
        # 3. Generate structured final report
        return self._format_final_report(query, simulation_id, discussion_logs)

    def _format_final_report(self, query: str, sim_id: str, logs: List[Dict[str, Any]]):
        # This would call an LLM with a 'Summarizer' profile
        return {
            "simulation_id": sim_id,
            "query": query,
            "final_consensus": 75,
            "recommended_decision": "proceed",
            "execution_summary": "Initial society simulation shows strong departmental support.",
            "top_quotes": logs[:3]
        }
