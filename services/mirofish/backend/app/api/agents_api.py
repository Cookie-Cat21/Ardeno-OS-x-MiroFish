from flask import Blueprint, jsonify
from ..services.agent_service import AgentService

agents_bp = Blueprint('agents', __name__)
agent_service = AgentService()

@agents_bp.route('/', methods=['GET'])
def list_agents():
    """List all agents or return a discovery summary."""
    try:
        from flask import request
        mode = request.args.get('mode', 'list') # 'list' or 'discovery'
        
        departments = [
            'Commercial & Growth', 'Design & Identity', 'Development & Engineering', 
            'Operations & Portal', 'Analytics & Research', 'Security & Compliance', 
            'Finance & Legal', 'Localization & Accessibility', 'Innovation & R&D'
        ]

        if mode == 'discovery':
            summary = {}
            for dept in departments:
                dept_agents = agent_service.list_by_department(dept)
                summary[dept] = {
                    "count": len(dept_agents),
                    "agents": [{"id": a['id'], "name": a['name'], "role": a.get('role')} for a in dept_agents[:3]] # Preview
                }
            return jsonify({
                "total_agents": sum(s['count'] for s in summary.values()),
                "departments": summary
            })

        # Default: Full list
        agents = []
        for dept in departments:
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
