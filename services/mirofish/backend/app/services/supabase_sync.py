import logging
from typing import Optional, List
from app.utils.supabase_client import get_admin_client, get_user_client
from app.models.bridge import Lead, ArdenoTask, IntelligenceReport
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class SupabaseSyncService:
    """
    Handles synchronization of MiroFish agent outputs to Ardeno OS Supabase.
    """

    @staticmethod
    def sync_lead(lead: Lead, auth_token: Optional[str] = None):
        """Syncs a lead to the 'leads' table."""
        try:
            client = get_user_client(auth_token) if auth_token else get_admin_client()
            data = lead.model_dump(exclude_none=True)
            
            # Map Pydantic field names to Supabase column names if necessary
            # (Assuming columns match Pydantic field names for now)
            
            result = client.table("leads").insert(data).execute()
            logger.info(f"Successfully synced lead: {lead.name}")
            return result
        except Exception as e:
            logger.error(f"Failed to sync lead to Supabase: {str(e)}")
            raise e

    @staticmethod
    def sync_task(task: ArdenoTask, auth_token: Optional[str] = None):
        """Syncs a task to the 'tasks' table."""
        try:
            client = get_user_client(auth_token) if auth_token else get_admin_client()
            data = task.model_dump(exclude_none=True)
            
            # Convert datetime to ISO string for Supabase
            if 'due_date' in data and data['due_date']:
                data['due_date'] = data['due_date'].isoformat()
            
            result = client.table("tasks").insert(data).execute()
            logger.info(f"Successfully synced task: {task.title}")
            return result
        except Exception as e:
            logger.error(f"Failed to sync task to Supabase: {str(e)}")
            raise e

    @staticmethod
    def sync_intelligence_report(report: IntelligenceReport, auth_token: Optional[str] = None):
        """Syncs an intelligence report to the 'intelligence_reports' table."""
        try:
            client = get_user_client(auth_token) if auth_token else get_admin_client()
            data = report.model_dump(exclude_none=True)
            
            if 'created_at' in data:
                data['created_at'] = data['created_at'].isoformat()
                
            result = client.table("intelligence_reports").insert(data).execute()
            logger.info(f"Successfully synced intelligence report: {report.title}")
            return result
        except Exception as e:
            logger.error(f"Failed to sync intelligence report to Supabase: {str(e)}")
            raise e

    @staticmethod
    def batch_sync_leads(leads: List[Lead], auth_token: Optional[str] = None):
        """Batch inserts multiple leads."""
        try:
            client = get_user_client(auth_token) if auth_token else get_admin_client()
            data = [lead.model_dump(exclude_none=True) for lead in leads]
            
            result = client.table("leads").insert(data).execute()
            logger.info(f"Successfully batch synced {len(leads)} leads")
            return result
        except Exception as e:
            logger.error(f"Failed to batch sync leads to Supabase: {str(e)}")
            raise e
