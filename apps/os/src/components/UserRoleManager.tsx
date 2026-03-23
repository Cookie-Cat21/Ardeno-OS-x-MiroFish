import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Shield, X, Crown, User, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole, useAllUserRoles, useSetUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

type RoleTarget = { user_id: string; email?: string; current_role: 'admin' | 'user' };

function RoleRow({ row, onSet, isLoading }: {
  row: RoleTarget;
  onSet: (userId: string, role: 'admin' | 'user') => void;
  isLoading: boolean;
}) {
  const isAdmin = row.current_role === 'admin';

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-card-2 transition-colors border-b border-border/40 last:border-0">
      {/* Avatar */}
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
        isAdmin ? 'bg-primary/20 text-primary' : 'bg-card-3 text-muted-foreground'
      )}>
        {row.email ? row.email[0].toUpperCase() : '?'}
      </div>

      {/* Email + role badge */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm truncate">{row.email ?? row.user_id.slice(0, 16) + '…'}</p>
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5',
          isAdmin ? 'bg-primary/10 text-primary' : 'bg-card-3 text-muted-foreground'
        )}>
          {isAdmin ? <Crown className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
          {row.current_role}
        </span>
      </div>

      {/* Toggle button */}
      <button
        disabled={isLoading}
        onClick={() => onSet(row.user_id, isAdmin ? 'user' : 'admin')}
        className={cn(
          'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0',
          isAdmin
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isAdmin ? (
          'Revoke Admin'
        ) : (
          'Make Admin'
        )}
      </button>
    </div>
  );
}

export function UserRoleManager() {
  const [open, setOpen] = useState(false);
  const { data: myRole } = useUserRole();
  const { data: allRoles = [], isLoading: rolesLoading } = useAllUserRoles();
  const setRole = useSetUserRole();

  // Only admins see this button
  if (myRole !== 'admin') return null;

  const handleSetRole = (userId: string, role: 'admin' | 'user') => {
    setRole.mutate({ userId, role }, {
      onSuccess: () => toast.success(`Role updated to ${role}`),
      onError:   () => toast.error('Failed to update role'),
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
          <Shield className="h-3.5 w-3.5" />
          Manage Roles
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md ardeno-panel rounded-2xl border border-border shadow-2xl focus:outline-none data-[state=open]:animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <Dialog.Title className="text-foreground font-semibold text-sm">
                User Role Manager
              </Dialog.Title>
            </div>
            <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Warning */}
          <div className="mx-6 mt-4 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-400 text-[11px]">
              Admins can see all tenants' projects and modify roles. Use with caution.
            </p>
          </div>

          {/* User list */}
          <div className="mt-4 max-h-80 overflow-y-auto">
            {rolesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
            ) : allRoles.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">No users found.</p>
            ) : (
              allRoles.map(row => (
                <RoleRow
                  key={row.user_id}
                  row={row}
                  onSet={handleSetRole}
                  isLoading={setRole.isPending && setRole.variables?.userId === row.user_id}
                />
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-border">
            <p className="text-muted-foreground text-[11px]">
              Changes take effect immediately. Users must refresh to see new permissions.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
