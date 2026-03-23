import { ScrollText, Undo2, RotateCcw } from 'lucide-react';
import { useAuditLogs, auditActionLabel, auditActionIcon } from '@/hooks/useAuditLogs';
import { useProjects } from '@/hooks/useProjects';
import { AuditLog, ProjectStage } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';

function LogRow({ log, onRollback }: {
  log:        AuditLog;
  onRollback: (log: AuditLog) => void;
}) {
  const canRollback =
    log.action === 'stage_changed' &&
    !log.rolled_back &&
    log.previous_state?.stage;

  return (
    <div className={cn(
      'flex items-center gap-3 py-3 border-b border-border/40 last:border-0',
      log.rolled_back && 'opacity-40'
    )}>
      <span className="text-lg shrink-0 w-6 text-center">{auditActionIcon(log.action)}</span>

      <div className="flex-1 min-w-0">
        <p className="text-foreground text-xs font-medium">{auditActionLabel(log.action)}</p>
        {log.meta.title && (
          <p className="text-muted-foreground text-[11px] truncate">{String(log.meta.title)}</p>
        )}
        {log.meta.to_stage && (
          <p className="text-muted-foreground text-[11px]">→ {String(log.meta.to_stage)}</p>
        )}
        {log.rolled_back && (
          <p className="text-muted-foreground/50 text-[10px] italic">Rolled back</p>
        )}
      </div>

      <span className="text-muted-foreground text-[10px] shrink-0">
        {formatRelativeTime(log.created_at)}
      </span>

      {canRollback && (
        <button
          onClick={() => onRollback(log)}
          title="Undo this action"
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function ActivityLogPage() {
  const { data: logs = [], isLoading } = useAuditLogs(100);
  const { rollbackStage } = useProjects();

  function handleRollback(log: AuditLog) {
    if (!log.entity_id || !log.previous_state?.stage) {
      toast.error('Cannot rollback — missing state data');
      return;
    }
    rollbackStage.mutate({
      projectId:     log.entity_id,
      auditLogId:    log.id,
      previousStage: log.previous_state.stage as ProjectStage,
    });
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-primary" />
        <p className="text-muted-foreground text-sm">
          {logs.length} log entries · Last 100 shown · Rollback available for stage changes
        </p>
      </div>

      <div className="ardeno-panel rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded shimmer" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <RotateCcw className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="px-4 divide-y divide-border/0">
            {logs.map(log => (
              <LogRow key={log.id} log={log} onRollback={handleRollback} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
