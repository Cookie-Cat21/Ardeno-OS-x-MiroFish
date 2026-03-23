import os
from typing import Dict, Any, Tuple
from ..config import Config

class CostGuard:
    """
    Tracks and enforces token/USD budgets per department and daily agency caps.
    """
    
    # In a production environment, these would be stored in Redis
    _daily_spend_usd = 0.0
    _dept_spend_usd: Dict[str, float] = {}
    
    HARD_DAILY_LIMIT = float(os.environ.get('MIROFISH_DAILY_CAP', '10.0'))
    DEPT_QUOTA = float(os.environ.get('MIROFISH_DEPT_QUOTA', '2.0'))

    def can_proceed(self, department: str) -> Tuple[bool, str]:
        if self._daily_spend_usd >= self.HARD_DAILY_LIMIT:
            return False, "Global agency daily budget reached."
        
        dept_current = self._dept_spend_usd.get(department, 0.0)
        if dept_current >= self.DEPT_QUOTA:
            return False, f"Department '{department}' has exceeded its thinking budget for today."
            
        return True, "Proceed"

    def record_cost(self, department: str, tokens_in: int, tokens_out: int, model: str):
        # Rough pricing calculation for gpt-4o-mini
        # $0.150 / 1M input tokens, $0.600 / 1M output tokens
        input_cost = (tokens_in / 1_000_000) * 0.150
        output_cost = (tokens_out / 1_000_000) * 0.600
        total_cost = input_cost + output_cost
        
        self._daily_spend_usd += total_cost
        self._dept_spend_usd[department] = self._dept_spend_usd.get(department, 0.0) + total_cost
        
        return total_cost
