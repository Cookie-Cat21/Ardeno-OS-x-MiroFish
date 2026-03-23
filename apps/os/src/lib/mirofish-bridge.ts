/**
 * MiroFish Bridge for Ardeno OS
 * Handles communication with the MiroFish Python backend.
 */

const MIROFISH_API_BASE = import.meta.env.PROD ? "/api" : "http://localhost:5001";

export interface StrategicReport {
  simulation_id: string;
  query: string;
  duration_minutes_simulated: number;
  final_consensus: number;
  recommended_decision: 'proceed' | 'pivot' | 'reject' | 'needs_human';
  confidence: number;
  key_risks: Array<{ description: string; severity: number; department: string }>;
  department_votes: Record<string, { score: number; reasoning: string }>;
  top_quotes: Array<{ agent_name: string; department: string; quote: string; impact: 'high' | 'medium' | 'low' }>;
  cost: { tokens_in: number; tokens_out: number; estimated_usd: number };
  execution_summary: string;
}

export interface SimulationRequest {
  files: File[];
  requirement: string;
}

export interface SimulationResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TaskStatusResponse {
  success: boolean;
  data: {
    status: string;
    progress: number;
    message: string;
    already_prepared?: boolean;
    result?: any;
  };
}

export interface RunStatusResponse {
  success: boolean;
  data: {
    runner_status: string;
    twitter_current_round: number;
    reddit_current_round: number;
    total_rounds: number;
    twitter_actions_count: number;
    reddit_actions_count: number;
    [key: string]: any;
  };
}

export const mirofishBridge = {
  /**
   * Initial upload of files and requirement.
   */
  uploadProject: async (req: SimulationRequest): Promise<SimulationResponse> => {
    const formData = new FormData();
    req.files.forEach((file) => formData.append("files", file));
    formData.append("simulationRequirement", req.requirement);

    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/start`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload project");
    }

    return response.json();
  },

  createSimulation: async (projectId: string): Promise<SimulationResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    return response.json();
  },

  prepareSimulation: async (simulationId: string): Promise<SimulationResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulation_id: simulationId }),
    });
    return response.json();
  },

  getPrepareStatus: async (taskId: string, simulationId: string): Promise<TaskStatusResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/prepare/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, simulation_id: simulationId }),
    });
    return response.json();
  },

  runSimulation: async (simulationId: string): Promise<SimulationResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/run/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        simulation_id: simulationId,
        platform: 'parallel',
        enable_graph_memory_update: true 
      }),
    });
    return response.json();
  },

  getRunStatus: async (simulationId: string): Promise<RunStatusResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/run/status/${simulationId}`);
    return response.json();
  },

  getRunDetails: async (simulationId: string) => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/simulation/run/status/detail/${simulationId}`);
    return response.json();
  },

  generateReport: async (simulationId: string): Promise<SimulationResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/report/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulation_id: simulationId, force_regenerate: true }),
    });
    return response.json();
  },

  getReport: async (reportId: string): Promise<SimulationResponse<StrategicReport>> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/report/${reportId}`);
    const data = await response.json();
    return { success: true, data };
  },

  getAgents: async (): Promise<SimulationResponse<any[]>> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/agents/`);
    const data = await response.json();
    return { success: true, data };
  },

  startAgencyProject: async (goal: string): Promise<SimulationResponse> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/agency/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    return response.json();
  },

  getAgencyStatus: async (projectId: string): Promise<SimulationResponse<any[]>> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/agency/status/${projectId}`);
    return response.json();
  },

  getAgencyInbox: async (): Promise<SimulationResponse<{ signals: any[] }>> => {
    const response = await fetch(`${MIROFISH_API_BASE}/api/agency/inbox`);
    return response.json();
  }
};
