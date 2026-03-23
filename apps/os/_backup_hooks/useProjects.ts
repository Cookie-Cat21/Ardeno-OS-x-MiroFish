import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Project, ProjectStage, REVIEW_TRIGGER_STAGES, canDragToStage } from '@/types';

export const PROJECTS_QK = ['projects'] as const;

// ─── Telegram notification helper ────────────────────────────
// SECURITY: The bot token is in VITE_ env vars (client-visible).
// For production, proxy this through a Supabase Edge Function.
async function sendTelegramAlert(text: string): Promise<void> {
  const token   = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined;
  const groupId = import.meta.env.VITE_TELEGRAM_GROUP_ID  as string | undefined;
  if (!token || !groupId) {
    console.warn('[Ardeno OS] Telegram vars not set — skipping alert');
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: groupId, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.warn('[Ardeno OS] Telegram alert failed:', err);
  }
}

async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('[Ardeno OS] Could not load projects (sign in required):', error.message);
    return [];
  }
  return (data ?? []) as Project[];
}

export function useProjects() {
  const qc = useQueryClient();
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: PROJECTS_QK,
    queryFn:  fetchProjects,
    staleTime: 30_000,
    retry: false,
  });

  // ─── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        qc.invalidateQueries({ queryKey: PROJECTS_QK });
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          const id = payload.new.id as string;
          setLastUpdatedId(id);
          setTimeout(() => setLastUpdatedId(null), 3200);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  // ─── Update stage (with auto-review + Telegram alert) ─────
  const updateStage = useMutation({
    mutationFn: async ({ id, stage, currentStage }: {
      id: string; stage: ProjectStage; currentStage: ProjectStage;
    }) => {
      if (!canDragToStage(currentStage, stage)) {
        throw new Error(`Cannot move from ${currentStage} to ${stage}`);
      }
      const { error } = await supabase.from('projects').update({ stage }).eq('id', id);
      if (error) throw error;
      return { id, stage, currentStage };
    },
    onMutate: async ({ id, stage, currentStage }) => {
      await qc.cancelQueries({ queryKey: PROJECTS_QK });
      const prev = qc.getQueryData<Project[]>(PROJECTS_QK);
      qc.setQueryData<Project[]>(PROJECTS_QK, (old = []) =>
        old.map(p => p.id === id ? { ...p, stage } : p)
      );
      return { prev, currentStage };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(PROJECTS_QK, ctx.prev);
      toast.error(err instanceof Error ? err.message : 'Failed to move project');
    },
    onSuccess: async (_data, { id, stage, currentStage }) => {
      const project = query.data?.find(p => p.id === id);

      // Audit log — store previous_state for rollback
      await supabase.from('audit_logs').insert({
        action:         'stage_changed',
        entity_type:    'project',
        entity_id:      id,
        meta:           { to_stage: stage, title: project?.title ?? '' },
        previous_state: { stage: currentStage },
      });

      // Auto-trigger edge-function review for Build/Security/Deploy
      const shouldAutoReview = REVIEW_TRIGGER_STAGES.includes(stage) || stage === 'Deploy';
      if (shouldAutoReview) {
        toast.info(`Moving to ${stage} — triggering agent review…`, { duration: 2500 });

        supabase.functions
          .invoke('consensus-review', { body: { project_id: id } })
          .then(async ({ data, error }) => {
            if (error) { toast.error('Agent review failed'); return; }

            const consensus = data?.consensus_score ?? data?.consensus;
            const risk      = data?.risk_score      ?? data?.risk;

            if (consensus !== undefined) {
              toast.success(`Agent review complete — consensus: ${consensus}%`, { duration: 4000 });
              qc.invalidateQueries({ queryKey: PROJECTS_QK });
            }

            // Autonomous Telegram alert when scores are concerning
            if (consensus < 70 || risk > 70) {
              const msg =
                `⚠️ <b>${project?.title ?? 'Project'}</b> needs review\n` +
                `Stage: <b>${stage}</b>\n` +
                `Consensus: <b>${consensus}%</b> · Risk: <b>${risk}%</b>\n` +
                `Action required in Ardeno OS`;
              await sendTelegramAlert(msg);
              toast.warning(`Telegram alert sent — consensus ${consensus}%`, { duration: 5000 });
            }

            // ── Deployment escalation ─────────────────────────────────
            // When stage = Deploy and consensus < 80%, show escalation toast
            // and send Telegram approval request (edge function handles the Telegram msg)
            if (stage === 'Deploy' && consensus !== undefined && consensus < 80) {
              toast.warning(
                `⚠️ Deployment needs approval — consensus ${consensus}% (< 80%).\nTelegram alert sent.`,
                { duration: 8000, id: `deploy-escalation-${id}` }
              );
            }
          });
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_QK }),
  });

  // ─── Rollback stage ───────────────────────────────────────
  const rollbackStage = useMutation({
    mutationFn: async ({ projectId, auditLogId, previousStage }: {
      projectId: string; auditLogId: string; previousStage: ProjectStage;
    }) => {
      const { error } = await supabase
        .from('projects').update({ stage: previousStage }).eq('id', projectId);
      if (error) throw error;
      await supabase.from('audit_logs').update({ rolled_back: true }).eq('id', auditLogId);
      await supabase.from('audit_logs').insert({
        action: 'stage_rollback', entity_type: 'project', entity_id: projectId,
        meta: { reverted_to: previousStage, original_log_id: auditLogId },
      });
    },
    onSuccess: () => { toast.success('Stage reverted ✓'); qc.invalidateQueries({ queryKey: PROJECTS_QK }); },
    onError:   (err) => toast.error(`Rollback failed: ${err instanceof Error ? err.message : 'Unknown'}`),
  });

  // ─── Update scores ────────────────────────────────────────
  const updateScores = useMutation({
    mutationFn: async ({ id, consensus_score, risk_score }: {
      id: string; consensus_score: number; risk_score: number;
    }) => {
      const { error } = await supabase.from('projects').update({ consensus_score, risk_score }).eq('id', id);
      if (error) throw error;
    },
    onError: () => toast.error('Failed to update scores'),
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_QK }),
  });

  // ─── Create project ───────────────────────────────────────
  const createProject = useMutation({
    mutationFn: async (values: {
      client_name: string; title: string; description?: string; stage: ProjectStage;
      budget?: number; deadline?: string; github_branch?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...values, user_id: user.id, consensus_score: 75, risk_score: 25 })
        .select().single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: async (project) => {
      await supabase.from('audit_logs').insert({
        action: 'project_created', entity_type: 'project', entity_id: project.id,
        meta: { title: project.title, client: project.client_name },
      });
      toast.success(`Project "${project.title}" created`);
      qc.invalidateQueries({ queryKey: PROJECTS_QK });
    },
    onError: (err) => toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`),
  });

  // ─── Delete project ───────────────────────────────────────
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Project deleted'); qc.invalidateQueries({ queryKey: PROJECTS_QK }); },
    onError:   () => toast.error('Failed to delete project'),
  });

  return { ...query, lastUpdatedId, updateStage, rollbackStage, updateScores, createProject, deleteProject };
}
