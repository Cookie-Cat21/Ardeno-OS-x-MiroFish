import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skill } from '@/types';

export interface SkillUsageStat extends Skill {
  total_bonus_pts: number;
  recent_projects: number;
}

/** Aggregated skills usage stats (joins skills + skill_usages) */
export function useSkillsUsage() {
  return useQuery({
    queryKey: ['skills-usage'],
    queryFn: async (): Promise<SkillUsageStat[]> => {
      // Fetch skills
      const { data: skills, error: skillErr } = await supabase
        .from('skills')
        .select('*')
        .order('usage_count', { ascending: false });
      if (skillErr) throw skillErr;

      // Fetch skill_usages for bonus/project context
      const { data: usages } = await supabase
        .from('skill_usages')
        .select('skill_id, bonus_pts, project_id');

      const usageMap = new Map<string, { totalBonus: number; projects: Set<string> }>();
      (usages ?? []).forEach(u => {
        if (!usageMap.has(u.skill_id)) {
          usageMap.set(u.skill_id, { totalBonus: 0, projects: new Set() });
        }
        const entry = usageMap.get(u.skill_id)!;
        entry.totalBonus += u.bonus_pts ?? 0;
        if (u.project_id) entry.projects.add(u.project_id);
      });

      return (skills ?? []).map(s => ({
        ...s,
        total_bonus_pts: Math.round((usageMap.get(s.id)?.totalBonus ?? 0) * 10) / 10,
        recent_projects: usageMap.get(s.id)?.projects.size ?? 0,
      }));
    },
    staleTime: 60_000,
  });
}

/** Simple aggregated stats for dashboard widgets */
export function useSkillsAnalytics() {
  return useQuery({
    queryKey: ['skills-analytics'],
    queryFn: async () => {
      const { data: skills } = await supabase
        .from('skills')
        .select('category, success_rate, usage_count, name');

      const byCategory = (skills ?? []).reduce<Record<string, number>>((acc, s) => {
        acc[s.category] = (acc[s.category] ?? 0) + 1;
        return acc;
      }, {});

      const top10ByUsage = [...(skills ?? [])]
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10)
        .map(s => ({ name: s.name.slice(0, 18), usage: s.usage_count, rate: s.success_rate }));

      return { byCategory, top10ByUsage };
    },
    staleTime: 60_000,
  });
}
