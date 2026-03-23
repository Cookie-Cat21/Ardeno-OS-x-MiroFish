import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AgentReview, AGENT_DEFINITIONS } from '@/types';

/** Fetch all reviews for a specific project */
export function useAgentReviews(projectId: string | undefined) {
  return useQuery({
    queryKey: ['agent-reviews', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('agent_reviews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[Ardeno OS] Could not load agent reviews (sign in required):', error.message);
        return [];
      }
      return (data ?? []) as AgentReview[];
    },
    enabled: !!projectId,
    staleTime: 30_000,
    retry: false,
  });
}

/** Alias for useAgentReviews — named explicitly for project-scoped usage in Flow Graph */
export const useProjectReviews = useAgentReviews;

/** Fetch aggregate stats across all reviews (for Agents page) */
export function useAgentStats() {
  return useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_reviews')
        .select('agent_name, score, weight, created_at');
      if (error) {
        console.warn('[Ardeno OS] Could not load agent stats (sign in required):', error.message);
        return AGENT_DEFINITIONS.map(agentDef => ({
          ...agentDef,
          totalReviews: 0,
          avgScore: 0,
          successRate: 0,
          recentScores: [],
        }));
      }

      const reviews = (data ?? []) as Pick<AgentReview, 'agent_name' | 'score' | 'weight' | 'created_at'>[];

      // Aggregate per agent
      return AGENT_DEFINITIONS.map(agentDef => {
        const agentReviews = reviews.filter(r => r.agent_name === agentDef.name);
        const total        = agentReviews.length;
        const avgScore     = total
          ? Math.round(agentReviews.reduce((s, r) => s + r.score, 0) / total)
          : 0;

        // Last 8 scores for sparkline
        const recentScores = agentReviews
          .slice(0, 8)
          .map(r => ({ score: Math.round(r.score), date: r.created_at }))
          .reverse();

        return {
          ...agentDef,
          totalReviews:  total,
          avgScore,
          successRate:   total ? Math.round((agentReviews.filter(r => r.score >= 70).length / total) * 100) : 0,
          recentScores,
        };
      });
    },
    staleTime: 60_000,
    retry: false,
  });
}
