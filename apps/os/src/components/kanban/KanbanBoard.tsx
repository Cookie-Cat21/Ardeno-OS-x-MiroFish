import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Project, ProjectStage, STAGE_ORDER, STAGE_META } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { KanbanColumn } from './KanbanColumn';
import { KanbanSkeleton } from './KanbanSkeleton';
import { NewProjectForm } from './NewProjectForm';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export function KanbanBoard() {
  const { data: projects = [], isLoading, isError, updateStage, lastUpdatedId } = useProjects();
  const { t } = useI18n();

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [glowIds,        setGlowIds]       = useState<Set<string>>(new Set());
  const [loadingIds,     setLoadingIds]    = useState<Set<string>>(new Set());
  const [showForm,       setShowForm]      = useState(false);
  const glowTimers = useRef<Map<string, number>>(new Map());

  // Track glow on realtime update
  useEffect(() => {
    if (!lastUpdatedId) return;
    setGlowIds(prev => new Set([...prev, lastUpdatedId]));
    const t = window.setTimeout(() => {
      setGlowIds(prev => { const n = new Set(prev); n.delete(lastUpdatedId); return n; });
    }, 3200);
    glowTimers.current.set(lastUpdatedId, t);
    return () => {
      if (t) clearTimeout(t);
    };
  }, [lastUpdatedId]);

  // Listen for "open-new-project" event from CommandPalette
  useEffect(() => {
    const handler = () => setShowForm(true);
    window.addEventListener('open-new-project', handler);
    return () => window.removeEventListener('open-new-project', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveProject(projects.find(p => p.id === active.id) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveProject(null);
    if (!over || active.id === over.id) return;

    const project      = projects.find(p => p.id === active.id);
    const targetStage  = over.id as ProjectStage;

    if (!project || !STAGE_ORDER.includes(targetStage)) return;
    if (project.stage === targetStage) return;

    // Add to loading set while mutation runs
    setLoadingIds(prev => new Set([...prev, project.id]));

    updateStage.mutate(
      { id: project.id, stage: targetStage, currentStage: project.stage },
      {
        onSettled: () => {
          setLoadingIds(prev => {
            const n = new Set(prev);
            n.delete(project.id);
            return n;
          });
        },
      }
    );
  }

  // Group projects by stage
  const byStage = STAGE_ORDER.reduce<Record<ProjectStage, Project[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<ProjectStage, Project[]>
  );
  projects.forEach(p => {
    if (byStage[p.stage]) byStage[p.stage].push(p);
  });

  if (isLoading) return <KanbanSkeleton />;

  return (
    <>
      <NewProjectForm open={showForm} onOpenChange={setShowForm} />

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in pipeline
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-primary text-background font-medium hover:bg-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('newProject')}
          </button>
        </div>

        {/* Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGE_ORDER.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                projects={byStage[stage]}
                glowIds={glowIds}
                loadingIds={loadingIds}
              />
            ))}
          </div>

          {/* Drag overlay (ghost card) */}
          <DragOverlay>
            {activeProject && (
              <div className={cn(
                'w-56 ardeno-panel rounded-lg p-3.5 border shadow-card-hover opacity-90 rotate-1',
                STAGE_META[activeProject.stage].borderColor
              )}>
                <p className="text-foreground text-sm font-semibold">{activeProject.title}</p>
                <p className="text-muted-foreground text-[11px]">{activeProject.client_name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
