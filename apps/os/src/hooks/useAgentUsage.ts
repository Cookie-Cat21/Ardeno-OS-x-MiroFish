import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentUsageRow {
  id: string;
  agent_id: string;
  agent_name: string;
  provider: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  response_time_ms: number | null;
  created_at: string;
}

export interface AgentUsageSummary {
  agent_id: string;
  agent_name: string;
  provider: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  avg_response_time: number;
}

export function useAgentUsage() {
  return useQuery({
    queryKey: ["agent-usage"],
    queryFn: async (): Promise<AgentUsageRow[]> => {
      const { data, error } = await supabase
        .from("agent_usage")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AgentUsageRow[];
    },
  });
}

export function useAgentUsageSummary() {
  const { data: rows, ...rest } = useAgentUsage();

  const summaries: AgentUsageSummary[] = [];
  if (rows) {
    const map = new Map<string, AgentUsageSummary>();
    for (const r of rows) {
      let s = map.get(r.agent_id);
      if (!s) {
        s = {
          agent_id: r.agent_id,
          agent_name: r.agent_name,
          provider: r.provider,
          total_requests: 0,
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_tokens: 0,
          total_cost: 0,
          avg_response_time: 0,
        };
        map.set(r.agent_id, s);
      }
      s.total_requests += 1;
      s.total_input_tokens += r.input_tokens || 0;
      s.total_output_tokens += r.output_tokens || 0;
      s.total_tokens += r.total_tokens || 0;
      s.total_cost += Number(r.estimated_cost) || 0;
      s.avg_response_time += r.response_time_ms || 0;
    }
    for (const s of map.values()) {
      if (s.total_requests > 0) s.avg_response_time = Math.round(s.avg_response_time / s.total_requests);
      summaries.push(s);
    }
    summaries.sort((a, b) => b.total_tokens - a.total_tokens);
  }

  return { data: summaries, rows, ...rest };
}

export async function logAgentUsage(params: {
  agent_id: string;
  agent_name: string;
  provider: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  estimated_cost?: number;
  response_time_ms?: number;
}) {
  const { error } = await supabase.from("agent_usage").insert({
    agent_id: params.agent_id,
    agent_name: params.agent_name,
    provider: params.provider,
    model: params.model ?? null,
    input_tokens: params.input_tokens ?? 0,
    output_tokens: params.output_tokens ?? 0,
    total_tokens: params.total_tokens ?? 0,
    estimated_cost: params.estimated_cost ?? 0,
    response_time_ms: params.response_time_ms ?? null,
  } as any);
  if (error) console.error("Failed to log agent usage:", error);
}
