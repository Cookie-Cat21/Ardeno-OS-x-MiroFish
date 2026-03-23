import requests
from typing import List, Dict, Any
from ..config import Config

class DataIngestService:
    """
    Scouts the internet for live signals, tech trends, and news
    to ground the parallel agency in reality.
    """
    
    def __init__(self):
        self.github_api_base = "https://api.github.com"
        
    def fetch_tech_trends(self, query: str = "AI Agents") -> List[Dict[str, Any]]:
        """
        Fetches trending repositories from GitHub related to a query.
        """
        print(f"DataIngestService: Scouting GitHub for '{query}'...")
        # In production: Use authenticated GitHub API call
        # Mocking trending results:
        return [
            {"title": "Ardeno OS Core Patterns", "description": "Cutting edge autonomous agency logic.", "stars": 1240},
            {"title": "MiroFish V2", "description": "Massive parallel agency simulations.", "stars": 5400}
        ]

    def fetch_global_signals(self) -> List[Dict[str, Any]]:
        """
        Fetches macro-economic and tech news signals.
        """
        print("DataIngestService: Aggregating global signals...")
        # Mocking RSS/News arrival:
        return [
            {"source": "TechCrunch", "content": "NVIDIA announces Blackwell-2 for 2026 data centers.", "impact": "high"},
            {"source": "SL Tech Hub", "content": "New tech park opening in Negombo, targeting AI startups.", "impact": "medium"}
        ]

    def summarize_context(self, signals: List[Dict[str, Any]]) -> str:
        """Compresses signals into a prompt snippet for agents."""
        summary = "Current Global Context:\n"
        for s in signals:
            summary += f"- [{s.get('source', 'GitHub')}] {s.get('content', s.get('title'))}\n"
        return summary
