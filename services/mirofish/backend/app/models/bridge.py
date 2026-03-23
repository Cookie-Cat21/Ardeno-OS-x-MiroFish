from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class LeadStatus(str, Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    CONTACTED = "contacted"
    CONVERTED = "converted"
    LOST = "lost"

class LeadSource(str, Enum):
    MIROFISH = "mirofish"
    MANUAL = "manual"
    GMAIL = "gmail"
    WEBSITE = "website"

class Lead(BaseModel):
    """Native Ardeno OS Lead Structure"""
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource = LeadSource.MIROFISH
    notes: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    intelligence_score: Optional[int] = Field(None, ge=0, le=100)
    user_id: Optional[str] = None # UUID of the owner

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class ArdenoTask(BaseModel):
    """Ardeno OS Task Structure for Agentic Assignment"""
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    assigned_agent: Optional[str] = None # Name or ID of the agent
    tags: List[str] = Field(default_factory=list)
    user_id: Optional[str] = None

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IntelligenceReport(BaseModel):
    """Strategic Foresight Output for the Intelligence Dashboard"""
    title: str
    summary: str
    content: str # Detailed markdown content
    risk_level: RiskLevel = RiskLevel.LOW
    impact_score: int = Field(0, ge=0, le=100)
    mitigation_strategy: Optional[str] = None
    category: str = "market_intelligence"
    tags: List[str] = Field(default_factory=list)
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
