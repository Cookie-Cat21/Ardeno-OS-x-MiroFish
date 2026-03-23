import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { STAGE_ORDER, STAGE_META } from '@/types';

export function useAnalyticsData() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [
        { data: projects },
        { data: reviews },
        { data: skills },
      ] = await Promise.all([
        supabase.from('projects').select('stage, consensus_score, risk_score, created_at').then(r => ({ data: r.error ? null : r.data })),
        supabase.from('agent_reviews').select('score, created_at, agent_name').order('created_at').then(r => ({ data: r.error ? null : r.data })),
        supabase.from('skills').select('category, usage_count, name, success_rate').then(r => ({ data: r.error ? null : r.data })),
      ]);

      // ─── Projects by stage (for pie chart) ────────────────
      const byStage = STAGE_ORDER.map(stage => ({
        stage,
        count:  (projects ?? []).filter(p => p.stage === stage).length,
        color:  STAGE_META[stage].hex,
      }));

      // ─── Average consensus over time (group by day) ────────
      const consensusByDay = groupByDay(
        (projects ?? []).map(p => ({ date: p.created_at, value: p.consensus_score }))
      );

      // ─── Risk distribution (bar) ──────────────────────────
      const riskBuckets = [
        { range: '0–25',  count: 0, color: '#10B981' },
        { range: '26–50', count: 0, color: '#F59E0B' },
        { range: '51–75', count: 0, color: '#F97316' },
        { range: '76–100',count: 0, color: '#EF4444' },
      ];
      (projects ?? []).forEach(p => {
        const r = p.risk_score;
        if (r <= 25) riskBuckets[0].count++;
        else if (r <= 50) riskBuckets[1].count++;
        else if (r <= 75) riskBuckets[2].count++;
        else riskBuckets[3].count++;
      });

      // ─── Top skills by usage ──────────────────────────────
      const topSkills = [...(skills ?? [])]
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 8)
        .map(s => ({
          name:  s.name.slice(0, 20),
          usage: s.usage_count,
          rate:  s.success_rate,
        }));

      // ─── Agent review trend (last 20 reviews avg by date) ─
      const reviewTrend = groupByDay(
        (reviews ?? []).map(r => ({ date: r.created_at, value: r.score }))
      ).slice(-14);

      return { byStage, consensusByDay, riskBuckets, topSkills, reviewTrend };
    },
    staleTime: 60_000,
    retry: false,
  });
}

/** Group time-series data by calendar day, averaging values */
function groupByDay(data: { date: string; value: number }[]): { day: string; avg: number }[] {
  const buckets = new Map<string, number[]>();
  data.forEach(({ date, value }) => {
    const day = date.slice(0, 10); // YYYY-MM-DD
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day)!.push(value);
  });
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, vals]) => ({
      day: day.slice(5), // MM-DD
      avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }));
}
