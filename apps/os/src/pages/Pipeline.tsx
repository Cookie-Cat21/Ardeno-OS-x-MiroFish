import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, ArrowLeft, Loader2, TrendingUp, MoveRight, Clock, Grip, Crosshair, Radio, FileText, Handshake, Trophy, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { cardHoverMotion, pageVariants, sectionReveal } from "@/lib/motion";

const STAGES = ["New Lead", "Contacted", "Proposal Sent", "Negotiating", "Closed Won", "Closed Dead"] as const;
type DealStage = (typeof STAGES)[number];

const STAGE_META: Record<string, { Icon: LucideIcon; gradient: string; dot: string; border: string; iconClass: string }> = {
  "New Lead": {
    Icon: Crosshair,
    gradient: "from-pipeline-info/10 via-pipeline-info/5 to-transparent",
    dot: "bg-pipeline-info",
    border: "border-pipeline-info/20",
    iconClass: "text-pipeline-info",
  },
  Contacted: {
    Icon: Radio,
    gradient: "from-warning/10 via-warning/5 to-transparent",
    dot: "bg-warning",
    border: "border-warning/20",
    iconClass: "text-warning",
  },
  "Proposal Sent": {
    Icon: FileText,
    gradient: "from-pipeline-proposal/10 via-pipeline-proposal/5 to-transparent",
    dot: "bg-pipeline-proposal",
    border: "border-pipeline-proposal/20",
    iconClass: "text-pipeline-proposal",
  },
  Negotiating: {
    Icon: Handshake,
    gradient: "from-primary/10 via-primary/5 to-transparent",
    dot: "bg-primary",
    border: "border-primary/20",
    iconClass: "text-primary",
  },
  "Closed Won": {
    Icon: Trophy,
    gradient: "from-success/10 via-success/5 to-transparent",
    dot: "bg-success",
    border: "border-success/20",
    iconClass: "text-success",
  },
  "Closed Dead": {
    Icon: XCircle,
    gradient: "from-muted-foreground/10 via-muted-foreground/5 to-transparent",
    dot: "bg-muted-foreground/60",
    border: "border-muted-foreground/20",
    iconClass: "text-muted-foreground",
  },
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

interface Deal {
  id: string;
  stage: string | null;
  value: number | null;
  next_action: string | null;
  last_contact: string | null;
  notes: string | null;
  client_id: string | null;
  lead_id: string | null;
  clients?: { name: string } | null;
}

/* ─── Droppable Column ─── */
function DroppableColumn({ stage, children, isOver }: { stage: string; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: stage });
  const meta = STAGE_META[stage];

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-2xl border ${meta.border} bg-gradient-to-b ${meta.gradient} min-h-[320px] p-2 space-y-2 transition-all duration-300 ${
        isOver ? "ring-2 ring-primary/40 bg-primary/5" : ""
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Draggable Deal Card ─── */
function DraggableDealCard({ deal, stage }: { deal: Deal; stage: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="group glass-card rounded-xl p-3 space-y-2.5 hover:border-primary/20 transition-all duration-200"
      {...cardHoverMotion}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-0.5 -ml-0.5">
            <Grip className="h-3 w-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
          </button>
          <h4 className="text-xs font-medium text-foreground truncate">
            {(deal.clients as any)?.name || deal.notes || "Untitled Deal"}
          </h4>
        </div>
        {deal.value != null && deal.value > 0 && (
          <span className="text-[10px] font-data text-primary font-medium shrink-0 bg-primary/5 px-1.5 py-0.5 rounded-md">
            ${deal.value.toLocaleString()}
          </span>
        )}
      </div>

      {/* Meta info */}
      {(deal.next_action || deal.last_contact) && (
        <div className="space-y-1">
          {deal.next_action && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <MoveRight className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{deal.next_action}</span>
            </div>
          )}
          {deal.last_contact && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              <span>{new Date(deal.last_contact).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Drag Overlay Card (ghost) ─── */
function DealCardOverlay({ deal }: { deal: Deal }) {
  return (
    <div className="glass-card rounded-xl p-3 space-y-2.5 border-primary/30 shadow-xl shadow-primary/10 rotate-2 scale-105">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Grip className="h-3 w-3 text-primary/60" />
          <h4 className="text-xs font-medium text-foreground truncate">
            {(deal.clients as any)?.name || deal.notes || "Untitled Deal"}
          </h4>
        </div>
        {deal.value != null && deal.value > 0 && (
          <span className="text-[10px] font-data text-primary font-medium shrink-0 bg-primary/5 px-1.5 py-0.5 rounded-md">
            ${deal.value.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ stage: "New Lead", value: "", next_action: "", notes: "" });
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("pipeline_deals").select("*, clients(name)").order("created_at", { ascending: false });
    if (data) setDeals(data as any[]);
    setLoading(false);
  };

  const create = async () => {
    const { error } = await supabase.from("pipeline_deals").insert({
      stage: form.stage,
      value: form.value ? Number(form.value) : null,
      next_action: form.next_action || null,
      notes: form.notes || null,
    });
    if (error) {
      toast.error("Failed to create deal");
      return;
    }
    toast.success("Deal created");
    setForm({ stage: "New Lead", value: "", next_action: "", notes: "" });
    setDialogOpen(false);
    load();
  };

  const moveDeal = async (dealId: string, newStage: string) => {
    setDeals((p) => p.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
    const { error } = await supabase.from("pipeline_deals").update({ stage: newStage }).eq("id", dealId);
    if (error) {
      toast.error("Failed to move deal");
      load(); // revert
      return;
    }
    toast.success(`Moved to ${newStage}`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (overId && STAGES.includes(overId as any)) {
      setOverStage(overId);
    } else {
      setOverStage(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);
    setOverStage(null);

    if (!over) return;

    const dealId = active.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    // Determine target stage: could be a stage column or another deal's id
    let targetStage: string | null = null;
    const overId = over.id as string;

    if (STAGES.includes(overId as any)) {
      targetStage = overId;
    } else {
      // Dropped on another deal — find that deal's stage
      const targetDeal = deals.find((d) => d.id === overId);
      if (targetDeal) targetStage = targetDeal.stage;
    }

    if (targetStage && targetStage !== deal.stage) {
      moveDeal(dealId, targetStage);
    }
  };

  const activeDeal = activeDealId ? deals.find((d) => d.id === activeDealId) : null;

  const totalPipeline = deals
    .filter((d) => d.stage !== "Closed Dead" && d.stage !== "Closed Won")
    .reduce((s, d) => s + (d.value || 0), 0);

  const wonTotal = deals.filter((d) => d.stage === "Closed Won").reduce((s, d) => s + (d.value || 0), 0);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={pageVariants}
      className="page-shell page-atmosphere max-w-[1600px] space-y-8"
    >
      {/* Header */}
      <motion.div variants={sectionReveal} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="section-label mb-0">Pipeline</div>
          <div className="flex items-center gap-5 mt-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
                <p className="text-sm font-display font-semibold text-foreground">${totalPipeline.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-success" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Won</p>
                <p className="text-sm font-display font-semibold text-success">${wonTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-border" />
            <p className="text-xs text-muted-foreground font-data">{deals.length} deals</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/leads">
            <Button variant="outline" size="sm" className="rounded-xl border-border/50 h-9">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Leads
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl h-9 shadow-lg shadow-primary/20">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Create Deal</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="rounded-xl" placeholder="Value ($)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                <Input className="rounded-xl" placeholder="Next action" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
                <Input className="rounded-xl" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <Button onClick={create} className="w-full rounded-xl shadow-lg shadow-primary/20">
                  Create Deal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Kanban Board with Drag & Drop */}
      <motion.div variants={sectionReveal} className="overflow-x-auto -mx-6 md:-mx-10 px-6 md:px-10 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-6 gap-3 min-w-[1100px]">
            {STAGES.map((stage, stageIdx) => {
              const meta = STAGE_META[stage];
              const stageDeals = deals.filter((d) => d.stage === stage);
              const total = stageDeals.reduce((s, d) => s + (d.value || 0), 0);

              return (
                <motion.div key={stage} variants={sectionReveal} className="space-y-3">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <meta.Icon className={`h-4 w-4 ${meta.iconClass}`} />
                      <div>
                        <h3 className="text-[11px] font-semibold text-foreground tracking-wide">{stage}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          <span className="text-[10px] text-muted-foreground">{stageDeals.length}</span>
                          {total > 0 && (
                            <span className="text-[10px] font-data text-muted-foreground ml-1">
                              ${total.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Droppable Column */}
                  <DroppableColumn stage={stage} isOver={overStage === stage}>
                    {/* Progress bar at top */}
                    <div className="h-0.5 rounded-full bg-border/30 mx-1 mb-1 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${meta.dot}`}
                        initial={{ width: 0 }}
                        animate={{ width: stageDeals.length > 0 ? `${Math.min(100, stageDeals.length * 20)}%` : "0%" }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: stageIdx * 0.1 }}
                      />
                    </div>

                    {stageDeals.map((deal) => (
                      <DraggableDealCard key={deal.id} deal={deal} stage={stage} />
                    ))}

                    {/* Empty state */}
                    {stageDeals.length === 0 && (
                      <div className="py-4">
                        <ArdenoEmptyState
                          icon={meta.Icon}
                          title={`No deals in ${stage}`}
                          description="This stage is clear right now. As leads move through Ardeno OS, they’ll appear here."
                          className="border-white/6 bg-white/[0.015] px-3 py-6 [&_h3]:text-sm [&_p]:text-xs"
                        />
                      </div>
                    )}
                  </DroppableColumn>
                </motion.div>
              );
            })}
          </div>

          <DragOverlay>
            {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
          </DragOverlay>
        </DndContext>
      </motion.div>
    </motion.div>
  );
}
