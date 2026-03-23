import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Bot, FileText, GitBranch, ExternalLink,
  Loader2, Palette, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Project, STAGE_META } from '@/types';
import { riskLabel, cn, truncate } from '@/lib/utils';
import { ConsensusSimulator } from './ConsensusSimulator';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { CanvaDesignDialog } from '@/components/CanvaDesignDialog';
import { exportProjectPDF } from '@/lib/pdf';
import { useActivity } from '@/context/ActivityContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProjectCardProps {
  project:        Project;
  isJustUpdated?: boolean;
  isLoading?:     boolean;
}

export function ProjectCard({ project, isJustUpdated, isLoading }: ProjectCardProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [showDetail,    setShowDetail]    = useState(false);
  const [showCanva,     setShowCanva]     = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const { addActivity } = useActivity();

  // ─── DnD ─────────────────────────────────────────────────
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.5 : 1,
    zIndex:     isDragging ? 50 : 'auto',
  };

  // ─── Derived ──────────────────────────────────────────────
  const stageMeta = STAGE_META[project.stage];
  const risk = riskLabel(project.risk_score);

  // Consensus ring degrees
  const consensusDeg = (project.consensus_score / 100) * 360;
  const ringColor =
    project.consensus_score >= 70 ? '#D4AF37'
    : project.consensus_score >= 50 ? '#F59E0B'
    : '#EF4444';

  // Canva button visible on Design/Quote stages
  const showCanvaButton = ['Quote', 'Design'].includes(project.stage);

  // ─── PDF export ───────────────────────────────────────────
  async function handleExportPDF(e: React.MouseEvent) {
    e.stopPropagation();
    setExporting(true);
    try {
      await exportProjectPDF(project);
      await supabase.from('audit_logs').insert({
        action:      'pdf_exported',
        entity_type: 'project',
        entity_id:   project.id,
        meta:        { title: project.title },
      });
      addActivity({ type: 'pdf', title: `📄 PDF exported — ${project.title}`, projectId: project.id });
      toast.success('PDF exported');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {/* ─── Card ─────────────────────────────────────────── */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'group glass rounded-lg p-3.5 border cursor-grab active:cursor-grabbing',
          'transition-all duration-200 hover:border-os-gold/30 hover:-translate-y-0.5 hover:shadow-card-hover',
          isJustUpdated && 'card-glow-updated',
          stageMeta.borderColor,
        )}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 rounded-lg bg-os-bg/70 flex items-center justify-center z-10 backdrop-blur-[2px]">
            <Loader2 className="h-5 w-5 text-os-gold animate-spin" />
          </div>
        )}

        {/* Stage badge */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
            stageMeta.bg, stageMeta.color
          )}>
            {stageMeta.label}
          </span>

          {/* Consensus ring */}
          <div
            className="h-7 w-7 rounded-full p-0.5 shrink-0"
            style={{
              background: `conic-gradient(${ringColor} ${consensusDeg}deg, rgba(30,37,56,0.6) ${consensusDeg}deg)`,
            }}
            title={`Consensus: ${project.consensus_score}%`}
          >
            <div className="h-full w-full rounded-full bg-os-surface flex items-center justify-center">
              <span className="text-[8px] font-bold text-os-text">{project.consensus_score}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h4
          className="text-os-text text-sm font-semibold leading-snug mb-0.5 cursor-pointer hover:text-os-gold transition-colors"
          onClick={e => { e.stopPropagation(); setShowDetail(true); }}
        >
          {truncate(project.title, 32)}
        </h4>
        <p className="text-os-muted text-[11px] mb-2.5">{project.client_name}</p>

        {/* Risk badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded', risk.bg, risk.color)}>
            {risk.label}
          </span>
          <span className="text-os-muted text-[9px]">{project.risk_score}%</span>
        </div>

        {/* GitHub branch */}
        {project.github_branch && (
          <div className="flex items-center gap-1 mb-2.5">
            <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
            <code className="text-[10px] text-purple-300 truncate">{project.github_branch}</code>
          </div>
        )}

        {/* Moodboard thumbnail */}
        {project.moodboard_url && (
          <div className="relative rounded overflow-hidden mb-2.5 h-14 border border-os-border/50 group/mb">
            <img
              src={project.moodboard_url}
              alt="Moodboard"
              className="w-full h-full object-cover"
            />
            <a
              href={project.moodboard_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/mb:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-4 w-4 text-white" />
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Agent Review */}
          <button
            onClick={e => { e.stopPropagation(); setShowSimulator(true); }}
            title="Run agent review"
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-os-muted hover:text-os-gold hover:bg-os-gold/10 transition-colors"
          >
            <Bot className="h-3 w-3" />
            Review
          </button>

          {/* Canva — only on Quote/Design */}
          {showCanvaButton && (
            <button
              onClick={e => { e.stopPropagation(); setShowCanva(true); }}
              title="Generate Canva moodboard"
              className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-os-muted hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
            >
              <Palette className="h-3 w-3" />
              Moodboard
            </button>
          )}

          {/* PDF */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            title="Export PDF proposal"
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-os-muted hover:text-os-teal hover:bg-os-teal/10 transition-colors disabled:opacity-50"
          >
            {exporting
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <FileText className="h-3 w-3" />
            }
            PDF
          </button>

          {/* Detail */}
          <button
            onClick={e => { e.stopPropagation(); setShowDetail(true); }}
            className="ml-auto flex items-center rounded px-1 py-1 text-[10px] text-os-muted hover:text-os-text hover:bg-os-surface-3 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ─── Dialogs ──────────────────────────────────────── */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSimulator(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-sm glass rounded-2xl border border-os-border shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-os-text font-semibold font-display">Agent Review</h3>
                <p className="text-os-muted text-xs mt-0.5">{project.title}</p>
              </div>
              <button onClick={() => setShowSimulator(false)} className="text-os-muted hover:text-os-text">
                ×
              </button>
            </div>
            <ConsensusSimulator project={project} onClose={() => setShowSimulator(false)} />
          </motion.div>
        </div>
      )}

      {showDetail && (
        <ProjectDetailDialog project={project} onClose={() => setShowDetail(false)} />
      )}

      {showCanva && (
        <CanvaDesignDialog project={project} onClose={() => setShowCanva(false)} />
      )}
    </>
  );
}
