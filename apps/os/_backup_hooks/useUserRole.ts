import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export type UserRole = 'user' | 'admin';

export const ROLE_QK = ['user-role'] as const;

/** Fetch the current user's role using a server-side RPC (bypasses RLS recursion) */
export function useUserRole() {
  return useQuery({
    queryKey: ROLE_QK,
    queryFn: async (): Promise<UserRole> => {
      const { data, error } = await supabase.rpc('get_my_role');
      if (error) {
        console.warn('[Ardeno OS] Could not fetch role:', error.message);
        return 'user';
      }
      return (data as UserRole) ?? 'user';
    },
    staleTime: 5 * 60_000, // roles don't change often
  });
}

/** Admin: set a role for any user */
export function useSetUserRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ROLE_QK });
    },
    onError: (err) => toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`),
  });
}

/** Fetch all users with their roles (admin-only via RLS policy) */
export function useAllUserRoles() {
  return useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, set_at');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
