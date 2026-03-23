import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SkillExecution {
  id: string;
  skill_id: string;
  skill_name: string;
  agent_id: string;
  agent_name: string;
  success: boolean;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface SkillOverride {
  id: string;
  skill_id: string;
  enabled: boolean;
  auto_disabled: boolean;
  disabled_reason: string | null;
  updated_at: string;
}

export interface SkillStats {
  skill_id: string;
  total_executions: number;
  successes: number;
  failures: number;
  success_rate: number;
  avg_execution_time: number;
  last_used: string | null;
  by_agent: Record<string, { total: number; successes: number }>;
}

export function useSkillExecutions() {
  return useQuery({
    queryKey: ["skill-executions"],
    queryFn: async (): Promise<SkillExecution[]> => {
      const { data, error } = await supabase
        .from("skill_executions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as SkillExecution[];
    },
  });
}

export function useSkillOverrides() {
  return useQuery({
    queryKey: ["skill-overrides"],
    queryFn: async (): Promise<SkillOverride[]> => {
      const { data, error } = await supabase
        .from("skill_overrides")
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as SkillOverride[];
    },
  });
}

export function useToggleSkillOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillId, enabled }: { skillId: string; enabled: boolean }) => {
      const { data: existing } = await supabase
        .from("skill_overrides")
        .select("id")
        .eq("skill_id", skillId)
        .maybeSingle() as any;

      if (existing) {
        await supabase
          .from("skill_overrides")
          .update({ enabled, auto_disabled: false, disabled_reason: enabled ? null : "Manually disabled", updated_at: new Date().toISOString() } as any)
          .eq("skill_id", skillId);
      } else {
        await supabase
          .from("skill_overrides")
          .insert({ skill_id: skillId, enabled, auto_disabled: false, disabled_reason: enabled ? null : "Manually disabled" } as any);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skill-overrides"] }),
  });
}

export function useSkillStats(): { stats: Record<string, SkillStats>; isLoading: boolean } {
  const { data: executions, isLoading } = useSkillExecutions();

  const stats: Record<string, SkillStats> = {};
  if (executions) {
    for (const exec of executions) {
      if (!stats[exec.skill_id]) {
        stats[exec.skill_id] = {
          skill_id: exec.skill_id,
          total_executions: 0,
          successes: 0,
          failures: 0,
          success_rate: 100,
          avg_execution_time: 0,
          last_used: null,
          by_agent: {},
        };
      }
      const s = stats[exec.skill_id];
      s.total_executions++;
      if (exec.success) s.successes++;
      else s.failures++;
      if (exec.execution_time_ms) s.avg_execution_time += exec.execution_time_ms;
      if (!s.last_used || exec.created_at > s.last_used) s.last_used = exec.created_at;

      if (!s.by_agent[exec.agent_id]) s.by_agent[exec.agent_id] = { total: 0, successes: 0 };
      s.by_agent[exec.agent_id].total++;
      if (exec.success) s.by_agent[exec.agent_id].successes++;
    }
    for (const s of Object.values(stats)) {
      s.success_rate = s.total_executions > 0 ? Math.round((s.successes / s.total_executions) * 100) : 100;
      s.avg_execution_time = s.total_executions > 0 ? Math.round(s.avg_execution_time / s.total_executions) : 0;
    }
  }

  return { stats, isLoading };
}
