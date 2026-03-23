"""
API路由模块
"""

from flask import Blueprint

graph_bp = Blueprint('graph', __name__)
simulation_bp = Blueprint('simulation', __name__)
report_bp = Blueprint('report', __name__)
agents_bp = Blueprint('agents', __name__)
agency_bp = Blueprint('agency', __name__)

from . import graph  # noqa: E402, F401
from . import simulation  # noqa: E402, F401
from . import report  # noqa: E402, F401
from .agents_api import agents_bp as agents_bp_impl  # noqa: E402
from .agency_api import agency_bp as agency_bp_impl  # noqa: E402
agents_bp = agents_bp_impl
agency_bp = agency_bp_impl

