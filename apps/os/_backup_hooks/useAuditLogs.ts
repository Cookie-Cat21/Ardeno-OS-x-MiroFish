import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AuditLog } from '@/types';

export const AUDIT_QK = ['audit-logs'] as const;

export function useAuditLogs(limit = 50) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...AUDIT_QK, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        console.warn('[Ardeno OS] Could not load audit logs (sign in required):', error.message);
        return [];
      }
      return (data ?? []) as AuditLog[];
    },
    staleTime: 15_000,
    retry: false,
  });

  // ─── Realtime subscription ────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('audit-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => qc.invalidateQueries({ queryKey: AUDIT_QK })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

/** Friendly label for audit log actions */
export function auditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    project_created:         'Project Created',
    stage_changed:           'Stage Changed',
    agent_review_completed:  'Agent Review Complete',
    github_commit_simulated: 'GitHub Commit (Mock)',
    pdf_exported:            'PDF Exported',
    skill_added:             'Skill Added',
    telegram_command:        'Telegram Command',
  };
  return labels[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/** Icon emoji for each audit action type */
export function auditActionIcon(action: string): string {
  const icons: Record<string, string> = {
    project_created:         '✨',
    stage_changed:           '⬆️',
    agent_review_completed:  '🤖',
    github_commit_simulated: '🔀',
    pdf_exported:            '📄',
    skill_added:             '🧩',
    telegram_command:        '📲',
  };
  return icons[action] ?? '📋';
}
