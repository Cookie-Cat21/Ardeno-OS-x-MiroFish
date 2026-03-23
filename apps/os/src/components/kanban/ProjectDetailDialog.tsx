import { X, GitBranch, Calendar, DollarSign, Bot, TrendingUp, ExternalLink, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, STAGE_META } from '@/types';
import { useProjectReviews } from '@/hooks/useAgentReviews';
import { riskLabel, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AgentFlowDialog } from '@/components/AgentFlowGraph';

interface ProjectDetailDialogProps {
  project:  Project | null;
  onClose:  () => void;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-card-3 overflow-hidden w-full">
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function ProjectDetailDialog({ project, onClose }: ProjectDetailDialogProps) {
  const { data: reviews = [] } = useProjectReviews(project?.id ?? '');

  if (!project) return null;

  const stageMeta = STAGE_META[project.stage];
  const { label: riskLabelText, color: riskColor } = riskLabel(project.risk_score);

  // Latest review set (most recent 3 rows = 1 review run)
  const latestReviews = reviews.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-xl ardeno-panel rounded-2xl border border-border shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', stageMeta.bg, stageMeta.color, `border ${stageMeta.borderColor}`)}>
                  {stageMeta.label}
                </span>
              </div>
              <h2 className="text-foreground font-semibold font-display text-lg">{project.title}</h2>
              <p className="text-muted-foreground text-sm">{project.client_name}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-card-3 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Description */}
            {project.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              {/* Consensus */}
              <div className="ardeno-panel rounded-xl p-4 border border-border space-y-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Consensus</p>
                <p className="text-primary text-2xl font-bold font-display">{project.consensus_score}%</p>
                <ScoreBar
                  score={project.consensus_score}
                  color={project.consensus_score >= 70 ? 'bg-primary' : project.consensus_score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                />
              </div>

              {/* Risk */}
              <div className="ardeno-panel rounded-xl p-4 border border-border space-y-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Risk Score</p>
                <p className={cn('text-2xl font-bold font-display', riskColor)}>{project.risk_score}%</p>
                <ScoreBar
                  score={project.risk_score}
                  color={project.risk_score < 40 ? 'bg-green-400' : project.risk_score <= 70 ? 'bg-yellow-400' : 'bg-red-400'}
                />
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-2">
              {project.github_branch && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="h-4 w-4 text-purple-400" />
                  <code className="text-purple-300 text-xs bg-purple-400/10 px-1.5 py-0.5 rounded">
                    {project.github_branch}
                  </code>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-foreground">{formatCurrency(project.budget)}</span>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  <span className="text-foreground">{new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-chart-2" />
                <span>Updated {formatRelativeTime(project.updated_at)}</span>
              </div>
            </div>

            {/* Agent Review Breakdown */}
            {latestReviews.length > 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs uppercase tracking-widest flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5" />
                  Latest Agent Votes
                </p>
                {latestReviews.map(review => (
                  <div key={review.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{review.agent_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px]">
                          weight ×{review.weight}
                        </span>
                        <span className={cn(
                          'font-semibold',
                          review.consensus_score >= 70 ? 'text-primary' : review.consensus_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {Math.round(review.consensus_score)}%
                        </span>
                      </div>
                    </div>
                    <ScoreBar
                      score={review.consensus_score}
                      color={review.consensus_score >= 70 ? 'bg-primary/80' : review.consensus_score >= 50 ? 'bg-yellow-400/80' : 'bg-red-400/80'}
                    />
                    {review.notes && (
                      <p className="text-muted-foreground text-[10px]">{review.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Moodboard thumbnail */}
            {project.moodboard_url && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs uppercase tracking-widest">Canva Moodboard</p>
                <div className="relative rounded-lg overflow-hidden border border-border group">
                  <img
                    src={project.moodboard_url}
                    alt="Moodboard preview"
                    className="w-full h-32 object-cover"
                  />
                  <a
                    href={project.moodboard_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-6 w-6 text-white" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Agent Flow Graph button */}
          {reviews.length > 0 && (
            <div className="px-6 pb-2 shrink-0">
              <AgentFlowDialog
                projectId={project.id}
                projectTitle={project.title}
                trigger={
                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-chart-2/30 bg-chart-2/5 text-chart-2 text-xs font-medium hover:bg-chart-2/10 transition-colors">
                    <Network className="h-3.5 w-3.5" />
                    View Interactive Agent Flow Graph
                  </button>
                }
              />
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 shrink-0">
            <p className="text-muted-foreground text-[10px] text-center">
              Created {formatRelativeTime(project.created_at)} · ID: {project.id.slice(0, 8)}…
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
