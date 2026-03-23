import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, ProjectStage, STAGE_META } from '@/types';
import { ProjectCard } from './ProjectCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage:     ProjectStage;
  projects:  Project[];
  glowIds:   Set<string>;
  loadingIds: Set<string>;
}

export function KanbanColumn({ stage, projects, glowIds, loadingIds }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = STAGE_META[stage];

  return (
    <div className="flex flex-col w-56 shrink-0">
      {/* Column header */}
      <div
        className={cn(
          'flex items-center justify-between rounded-lg px-3 py-2 mb-3',
          meta.bg, `border ${meta.borderColor}`
        )}
      >
        <span className={cn('text-xs font-semibold uppercase tracking-wider', meta.color)}>
          {meta.label}
        </span>
        <span className={cn(
          'text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center',
          meta.bg, meta.color
        )}>
          {projects.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] rounded-xl p-2 transition-all duration-200 space-y-2',
          isOver
            ? 'bg-os-gold/5 border border-os-gold/30 ring-1 ring-os-gold/20'
            : 'bg-os-surface/30 border border-transparent'
        )}
      >
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {projects.map(project => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <ProjectCard
                  project={project}
                  isJustUpdated={glowIds.has(project.id)}
                  isLoading={loadingIds.has(project.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {projects.length === 0 && (
            <div className={cn(
              'flex items-center justify-center h-16 rounded-lg border border-dashed text-xs text-os-muted transition-colors',
              isOver ? `border-os-gold/40 ${meta.color}` : 'border-os-border/40'
            )}>
              {isOver ? 'Drop here' : 'Empty'}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
