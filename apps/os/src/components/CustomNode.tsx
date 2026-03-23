/**
 * Ardeno OS — CustomNode
 * Custom React Flow node renderer.
 * Renders agent / skill / tool / product nodes with:
 *   - Type-specific border colors (teal=agent, gold=skill, purple=tool, green=product)
 *   - Glow on hover (CSS)
 *   - Score ring (arc drawn via inline SVG)
 *   - Emoji icon
 *   - Category badge
 *   - React Flow handles (invisible, for edges)
 */
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import type { AgentFlowNodeData } from '@/hooks/useAgentFlowData';

// ─── Color palette per node type ──────────────────────────────────────────

const TYPE_CONFIG = {
  agent:   { border: '#00A896', bg: 'rgba(0,168,150,0.08)',  glow: '0 0 14px rgba(0,168,150,0.35)'  },
  skill:   { border: '#D4AF37', bg: 'rgba(212,175,55,0.08)', glow: '0 0 14px rgba(212,175,55,0.35)' },
  tool:    { border: '#C084FC', bg: 'rgba(192,132,252,0.08)',glow: '0 0 14px rgba(192,132,252,0.35)' },
  product: { border: '#4ADE80', bg: 'rgba(74,222,128,0.08)', glow: '0 0 18px rgba(74,222,128,0.45)' },
};

// ─── Small score arc SVG ──────────────────────────────────────────────────

function ScoreArc({ score, color }: { score: number; color: string }) {
  const r      = 18;
  const circ   = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <svg width={44} height={44} viewBox="0 0 44 44" className="shrink-0">
      {/* Background track */}
      <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
      {/* Score fill — starts at 12 o'clock, goes clockwise */}
      <circle
        cx={22} cy={22} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={22} y={27} textAnchor="middle" fontSize={9} fill={color} fontWeight="600" fontFamily="monospace">
        {score}%
      </text>
    </svg>
  );
}

// ─── Custom node ──────────────────────────────────────────────────────────

interface CustomNodeProps {
  data:     AgentFlowNodeData;
  selected: boolean;
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const config = TYPE_CONFIG[data.type] ?? TYPE_CONFIG.agent;
  const scoreColor = data.score !== undefined
    ? data.score >= 80 ? '#4ADE80' : data.score >= 60 ? '#D4AF37' : '#EF4444'
    : config.border;

  return (
    <div
      className={cn(
        'relative rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200',
        'hover:scale-105',
        selected && 'ring-2 ring-white/30'
      )}
      style={{
        background:  config.bg,
        border:      `1.5px solid ${config.border}`,
        boxShadow:   selected ? config.glow : '0 2px 12px rgba(0,0,0,0.5)',
        minWidth:    140,
        maxWidth:    180,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* React Flow handles — invisible but required for edge connections */}
      <Handle type="target" position={Position.Left}
        style={{ width: 7, height: 7, background: config.border, border: 'none', left: -4 }} />
      <Handle type="source" position={Position.Right}
        style={{ width: 7, height: 7, background: config.border, border: 'none', right: -4 }} />

      {/* Content */}
      <div className="flex items-center gap-2.5">
        {/* Icon bubble */}
        <div
          className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: `${config.border}15`, border: `1px solid ${config.border}30` }}
        >
          {data.icon}
        </div>

        {/* Main text */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold leading-tight" style={{ color: config.border }}>
            {data.label}
          </p>
          {data.category && (
            <p className="text-[9px] mt-0.5 text-white/40 uppercase tracking-wider truncate">
              {data.category}
            </p>
          )}
          {data.usageCount !== undefined && (
            <p className="text-[9px] text-white/40">
              {data.usageCount} uses
            </p>
          )}
        </div>

        {/* Score arc */}
        {data.score !== undefined && (
          <ScoreArc score={data.score} color={scoreColor} />
        )}
      </div>

      {/* Risk indicator (agent nodes only) */}
      {data.risk !== undefined && (
        <div className="mt-1.5 flex items-center gap-1">
          <div
            className="h-1 flex-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.risk}%`,
                background: data.risk > 70 ? '#EF4444' : data.risk > 40 ? '#F59E0B' : '#10B981',
              }}
            />
          </div>
          <span className="text-[8px] text-white/30 shrink-0">{data.risk}% risk</span>
        </div>
      )}

      {/* Type badge */}
      <div
        className="absolute -top-2 -right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
        style={{ background: config.border, color: '#0B0E17' }}
      >
        {data.type}
      </div>
    </div>
  );
}
