import time
from typing import Dict, Any, List
from ..utils.supabase_client import get_admin_client

class BudgetGuard:
    """
    Enforces hard budget limits for Groq and Gemini APIs.
    Routes requests based on token usage and availability.
    """
    
    # HARD LIMITS (Daily)
    GROQ_TOKEN_LIMIT = 8_000_000
    GEMINI_REQUEST_LIMIT = 1_200
    
    def __init__(self):
        self.supabase = get_admin_client()

    def _get_daily_stats(self):
        """Fetch today's usage stats from Supabase."""
        today = time.strftime("%Y-%m-%d")
        response = self.supabase.table("api_usage_stats").select("*").eq("date", today).execute()
        
        if not response.data:
            # Initialize for today
            data = {"date": today, "groq_tokens": 0, "gemini_requests": 0}
            self.supabase.table("api_usage_stats").insert(data).execute()
            return data
        return response.data[0]

    def can_use_groq(self, estimated_tokens: int) -> bool:
        stats = self._get_daily_stats()
        return (stats['groq_tokens'] + estimated_tokens) < self.GROQ_TOKEN_LIMIT

    def can_use_gemini(self) -> bool:
        stats = self._get_daily_stats()
        return stats['gemini_requests'] < self.GEMINI_REQUEST_LIMIT

    def log_usage(self, groq_tokens: int = 0, gemini_request: bool = False):
        """Update usage counters in Supabase."""
        today = time.strftime("%Y-%m-%d")
        stats = self._get_daily_stats()
        
        update_data = {
            "groq_tokens": stats['groq_tokens'] + groq_tokens,
            "gemini_requests": stats['gemini_requests'] + (1 if gemini_request else 0)
        }
        self.supabase.table("api_usage_stats").update(update_data).eq("date", today).execute()

    def get_best_model(self, task_complexity: str, estimated_tokens: int = 1000) -> str:
        """
        Intelligent routing:
        - High Complexity -> Llama 3.1 70B (Groq) if budget allows, else Gemini 1.5 Flash.
        - Low Complexity -> Llama 3.1 8B (Groq) if budget allows, else Gemini 1.5 Flash.
        """
        if task_complexity == "high":
            if self.can_use_groq(estimated_tokens):
                return "groq/llama-3.1-70b-versatile"
            return "google/gemini-1.5-flash"
        else:
            if self.can_use_groq(estimated_tokens):
                return "groq/llama-3.1-8b-instant"
            return "google/gemini-1.5-flash"

# Usage Example:
# guard = BudgetGuard()
# model = guard.get_best_model("high")
# ... call API ...
# guard.log_usage(groq_tokens=usage.total_tokens)
