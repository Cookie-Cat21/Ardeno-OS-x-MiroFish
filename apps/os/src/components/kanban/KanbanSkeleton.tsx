import { STAGE_ORDER } from '@/types';

function CardSkeleton() {
  return (
    <div className="ardeno-panel rounded-lg p-4 border border-border/50 space-y-3 animate-skeleton-wave">
      <div className="h-3 w-3/4 rounded shimmer" />
      <div className="h-2.5 w-1/2 rounded shimmer" />
      <div className="h-2 w-full rounded shimmer" />
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-12 rounded-full shimmer" />
        <div className="h-5 w-16 rounded-full shimmer" />
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGE_ORDER.map(stage => (
        <div key={stage} className="w-56 shrink-0 space-y-3">
          {/* Column header */}
          <div className="h-8 rounded-lg shimmer" />
          {/* Cards */}
          {Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ))}
    </div>
  );
}
