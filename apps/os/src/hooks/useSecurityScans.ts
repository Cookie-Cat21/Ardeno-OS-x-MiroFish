import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface SecurityScan {
  id:             string;
  project_id:     string;
  scan_timestamp: string;
  vulns_found:    number;
  risk_delta:     number;
  details:        Array<{
    type:        string;
    severity:    'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}

export const SCANS_QK = ['security-scans'] as const;

/** Fetch all scans (optionally filtered by project) */
export function useSecurityScans(projectId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...SCANS_QK, projectId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('security_scans')
        .select('*')
        .order('scan_timestamp', { ascending: false })
        .limit(50);
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) {
        console.warn('[Ardeno OS] Could not load security scans (sign in required):', error.message);
        return [];
      }
      return (data ?? []) as SecurityScan[];
    },
    staleTime: 30_000,
    retry: false,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('scans-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_scans' }, () => {
        qc.invalidateQueries({ queryKey: SCANS_QK });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

/** Run a security scan via edge function */
export function useRunSecurityScan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase.functions.invoke('security-scan', {
        body: { project_id: projectId },
      });
      if (error) throw error;
      return data as { vulns_found: number; risk_delta: number; details: SecurityScan['details'] };
    },
    onSuccess: (data) => {
      if (data.vulns_found === 0) {
        toast.success('Security scan complete — no vulnerabilities found ✓');
      } else {
        toast.warning(
          `Security scan: ${data.vulns_found} issue(s) found · Risk +${data.risk_delta}%`,
          { duration: 6000 }
        );
      }
      qc.invalidateQueries({ queryKey: SCANS_QK });
      // Also refresh projects (risk_score may have changed)
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => toast.error(`Scan failed: ${err instanceof Error ? err.message : 'Unknown'}`),
  });
}
