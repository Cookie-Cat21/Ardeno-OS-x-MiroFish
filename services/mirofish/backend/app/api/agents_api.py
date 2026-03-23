from flask import Blueprint, jsonify
from ..services.agent_service import AgentService

agents_bp = Blueprint('agents', __name__)
agent_service = AgentService()

@agents_bp.route('/', methods=['GET'])
def list_agents():
    """List all agents in the society."""
    try:
        # For MVP, we'll return a sample of agents or all if society is small
        # In production, this would be paginated
        agents = []
        for dept in [
            'Commercial & Growth', 'Design & Identity', 'Development & Engineering', 
            'Operations & Portal', 'Analytics & Research', 'Security & Compliance', 
            'Finance & Legal', 'Localization & Accessibility', 'Innovation & R&D'
        ]:
            agents.extend(agent_service.list_by_department(dept))
        
        return jsonify(agents)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@agents_bp.route('/<agent_id>', methods=['GET'])
def get_agent_details(agent_id):
    """Retrieve detailed state of a specific agent."""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        return jsonify({"error": "Agent not found"}), 404
    return jsonify(agent)
