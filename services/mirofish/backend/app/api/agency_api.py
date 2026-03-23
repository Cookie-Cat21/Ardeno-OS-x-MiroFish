from flask import Blueprint, jsonify, request
from ..services.workflow_engine import WorkflowEngine

from ..services.data_ingest_service import DataIngestService

agency_bp = Blueprint('agency', __name__)
workflow_engine = WorkflowEngine()
data_ingest = DataIngestService()

@agency_bp.route('/inbox', methods=['GET'])
def get_agency_inbox():
    """Retrieve live signals for the Foresight Inbox."""
    signals = data_ingest.fetch_global_signals()
    return jsonify({"signals": signals})

@agency_bp.route('/start', methods=['POST'])
def start_agency_project():
    """Trigger a new autonomous project across all departments."""
    data = request.json
    goal = data.get('goal')
    if not goal:
        return jsonify({"error": "No goal provided"}), 400
    
    project_id = workflow_engine.start_project(goal)
    return jsonify({"project_id": project_id, "status": "initiated"})

@agency_bp.route('/status/<project_id>', methods=['GET'])
def get_agency_status(project_id):
    """Retrieve the current state of a departmental workflow."""
    status = workflow_engine.get_project_status(project_id)
    if not status:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(status)

@agency_bp.route('/tickets/complete', methods=['POST'])
def complete_agency_ticket():
    """Callback for a departmental worker to mark a ticket as done."""
    data = request.json
    project_id = data.get('project_id')
    ticket_id = data.get('ticket_id')
    result = data.get('result')
    
    workflow_engine.complete_ticket(project_id, ticket_id, result)
    return jsonify({"status": "updated"})
