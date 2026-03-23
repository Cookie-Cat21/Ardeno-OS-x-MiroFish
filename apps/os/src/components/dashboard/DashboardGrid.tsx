import { ReactNode, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardGridProps {
  widgetOrder: string[];
  onReorder: (newOrder: string[]) => void;
  widgets: Record<string, { label: string; component: ReactNode }>;
}

function SortableWidget({
  id,
  label,
  children,
  isActive,
}: {
  id: string;
  label: string;
  children: ReactNode;
  isActive: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition: transition || "transform 250ms cubic-bezier(0.25,1,0.5,1)",
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-opacity duration-200 ${
        isDragging ? "opacity-30 scale-[0.98]" : "opacity-100"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-3 z-10 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded"
        title={`Drag to reorder: ${label}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

export default function DashboardGrid({
  widgetOrder,
  onReorder,
  widgets,
}: DashboardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  const orderedIds = widgetOrder.filter((id) => widgets[id]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-10">
          {orderedIds.map((id) => (
            <SortableWidget
              key={id}
              id={id}
              label={widgets[id].label}
              isActive={activeId === id}
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {widgets[id].component}
              </motion.div>
            </SortableWidget>
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{
        duration: 300,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        {activeId && widgets[activeId] ? (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.02, rotate: 0.5, boxShadow: "0 20px 60px -10px hsl(var(--primary) / 0.15), 0 8px 20px -6px hsl(0 0% 0% / 0.2)" }}
            className="rounded-2xl bg-background/80 backdrop-blur-xl border border-primary/20 p-1 cursor-grabbing"
          >
            {widgets[activeId].component}
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
