import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Skill } from '@/types';

export const SKILLS_QK = ['skills'] as const;

async function fetchSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('last_updated', { ascending: false });
  if (error) {
    console.warn('[Ardeno OS] Could not load skills (sign in required):', error.message);
    return [];
  }
  return (data ?? []) as Skill[];
}

export function useSkills() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SKILLS_QK,
    queryFn:  fetchSkills,
    staleTime: 60_000,
    retry: false,
  });

  // ─── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('skills-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skills' },
        () => qc.invalidateQueries({ queryKey: SKILLS_QK })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  // ─── Create ───────────────────────────────────────────────
  const createSkill = useMutation({
    mutationFn: async (values: {
      name:         string;
      description?: string;
      category:     string;
      success_rate: number;
      version:      string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('skills')
        .insert({ ...values, created_by: user.id, usage_count: 0 })
        .select()
        .single();
      if (error) throw error;
      return data as Skill;
    },
    onSuccess: (skill) => {
      toast.success(`Skill "${skill.name}" added to registry`);
      qc.invalidateQueries({ queryKey: SKILLS_QK });
    },
    onError: (err) =>
      toast.error(`Failed to add skill: ${err instanceof Error ? err.message : 'Unknown error'}`),
  });

  // ─── Update ───────────────────────────────────────────────
  const updateSkill = useMutation({
    mutationFn: async ({ id, ...values }: Partial<Skill> & { id: string }) => {
      const { error } = await supabase.from('skills').update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Skill updated');
      qc.invalidateQueries({ queryKey: SKILLS_QK });
    },
    onError: () => toast.error('Failed to update skill'),
  });

  // ─── Increment usage ──────────────────────────────────────
  const incrementUsage = useMutation({
    mutationFn: async (id: string) => {
      // Try RPC first, fall back to manual update
      const { error } = await supabase.rpc('increment_skill_usage', { skill_id: id });
      if (error) {
        const skill = query.data?.find(s => s.id === id);
        if (skill) {
          const { error: updateErr } = await supabase
            .from('skills')
            .update({ usage_count: skill.usage_count + 1 })
            .eq('id', id);
          if (updateErr) throw updateErr;
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SKILLS_QK }),
  });

  // ─── Increment usage for random skills (called by ConsensusSimulator) ─
  const bumpRandomSkills = async (count = 2) => {
    const skills = query.data;
    if (!skills?.length) return;
    const shuffled = [...skills].sort(() => Math.random() - 0.5);
    const picked   = shuffled.slice(0, count);
    for (const skill of picked) {
      await incrementUsage.mutateAsync(skill.id);
    }
  };

  return { ...query, createSkill, updateSkill, incrementUsage, bumpRandomSkills };
}
