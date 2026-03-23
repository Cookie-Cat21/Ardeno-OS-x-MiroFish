/**
 * Ardeno OS — AgentFlowGraph
 * Interactive directed-graph view using react-flow-renderer.
 *
 * Features:
 *   • Zoom / pan / drag nodes (built-in ReactFlow)
 *   • Minimap (bottom-right corner)
 *   • Controls (fit view, zoom in/out, lock)
 *   • Custom nodes with score arcs, emoji icons, risk bars
 *   • Hover tooltip (Radix HoverCard) with full node details
 *   • Click node → open detail Dialog
 *   • "Show critical path" toggle — highlights low-consensus / high-risk edges
 *   • Export as PNG via html-to-image (if installed) or fallback message
 *   • Realtime updates via Supabase subscriptions (agent_reviews + audit_logs)
 *   • Node positions saved to localStorage per project
 *   • Dark-mode CSS overrides
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  NodeMouseHandler,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X, Filter, Download, Maximize2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { CustomNode } from '@/components/CustomNode';
import { useAgentFlowData, AgentFlowNodeData } from '@/hooks/useAgentFlowData';

// ─── Register custom node types ───────────────────────────────────────────
const nodeTypes = {
  agentFlowNode: CustomNode,
};

// ─── localStorage helpers for node positions ──────────────────────────────
function loadPositions(projectId: string): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(`ardeno_flow_pos_${projectId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePositions(projectId: string, nodes: Node[]) {
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => { pos[n.id] = n.position; });
  localStorage.setItem(`ardeno_flow_pos_${projectId}`, JSON.stringify(pos));
}

// ─── Detail dialog ────────────────────────────────────────────────────────

function NodeDetailDialog({
  node,
  onClose,
}: {
  node: Node<AgentFlowNodeData> | null;
  onClose: () => void;
}) {
  if (!node) return null;
  const d = node.data;

  const TYPE_COLOR: Record<string, string> = {
    agent:   '#00A896',
    skill:   '#D4AF37',
    tool:    '#C084FC',
    product: '#4ADE80',
  };
  const col = TYPE_COLOR[d.type] ?? '#8892A4';

  return (
    <Dialog.Root open={!!node} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm ardeno-panel rounded-2xl border border-border shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">{d.icon}</span>
              <Dialog.Title className="text-foreground font-semibold text-sm">{d.label}</Dialog.Title>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: `${col}20`, color: col }}>
                {d.type}
              </span>
            </div>
            <Dialog.Close onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 space-y-3">
            {d.category && (
              <div><span className="text-muted-foreground text-xs">Category: </span><span className="text-foreground text-xs">{d.category}</span></div>
            )}
            {d.score !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Score</span>
                  <span style={{ color: col }} className="font-semibold">{d.score}%</span>
                </div>
                <div className="h-1.5 bg-card-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${d.score}%`, background: col }} />
                </div>
              </div>
            )}
            {d.risk !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Risk</span>
                  <span className={cn('font-semibold', d.risk > 70 ? 'text-red-400' : d.risk > 40 ? 'text-yellow-400' : 'text-green-400')}>
                    {d.risk}%
                  </span>
                </div>
                <div className="h-1.5 bg-card-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${d.risk}%`,
                    background: d.risk > 70 ? '#EF4444' : d.risk > 40 ? '#F59E0B' : '#10B981',
                  }} />
                </div>
              </div>
            )}
            {d.usageCount !== undefined && (
              <div><span className="text-muted-foreground text-xs">Usage count: </span><span className="text-foreground text-xs font-semibold">{d.usageCount}×</span></div>
            )}
            {d.reasoning && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Agent reasoning</p>
                <p className="text-foreground text-xs bg-card-2 rounded-lg px-3 py-2 leading-relaxed">{d.reasoning}</p>
              </div>
            )}
            {d.timestamp && (
              <p className="text-muted-foreground text-[10px]">Last active: {new Date(d.timestamp).toLocaleString()}</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Inner graph (needs ReactFlowProvider context) ────────────────────────

interface AgentFlowInnerProps {
  projectId: string;
}

function AgentFlowInner({ projectId }: AgentFlowInnerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useAgentFlowData(projectId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode,   setSelectedNode]   = useState<Node<AgentFlowNodeData> | null>(null);
  const [criticalOnly,   setCriticalOnly]   = useState(false);
  const [exporting,      setExporting]      = useState(false);
  const [initialized,    setInitialized]    = useState(false);
  const [realtimePulse,  setRealtimePulse]  = useState(false);

  const qc         = useQueryClient();
  const { fitView } = useReactFlow();
  const flowRef    = useRef<HTMLDivElement>(null);

  // Apply saved positions from localStorage on first load
  useEffect(() => {
    if (initialNodes.length === 0 || initialized) return;
    const saved = loadPositions(projectId);
    const withPos = initialNodes.map(n => ({
      ...n,
      position: saved[n.id] ?? n.position,
    }));
    setNodes(withPos);
    setEdges(initialEdges);
    setInitialized(true);
    // Wait for layout to settle then fit view
    setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 100);
  }, [initialNodes, initialEdges, initialized, projectId, setNodes, setEdges, fitView]);

  // Update nodes/edges when data changes (realtime refreshes)
  useEffect(() => {
    if (!initialized || initialNodes.length === 0) return;
    const saved = loadPositions(projectId);
    setNodes(prev => initialNodes.map(n => ({
      ...n,
      position: saved[n.id] ?? prev.find(p => p.id === n.id)?.position ?? n.position,
    })));
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, initialized, projectId, setNodes, setEdges]);

  // ── Realtime subscription ─────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`flow-realtime-${projectId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'agent_reviews',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['agent-reviews', projectId] });
        qc.invalidateQueries({ queryKey: ['audit-logs', projectId] });
        // Flash the graph to indicate update
        setRealtimePulse(true);
        setTimeout(() => setRealtimePulse(false), 1500);
      })
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'audit_logs',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['audit-logs', projectId] });
        setRealtimePulse(true);
        setTimeout(() => setRealtimePulse(false), 1500);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, qc]);

  // ── Save positions on node drag end ───────────────────────────────────
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node, allNodes: Node[]) => {
      savePositions(projectId, allNodes);
    },
    [projectId]
  );

  // ── Node click → detail dialog ────────────────────────────────────────
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node as Node<AgentFlowNodeData>);
  }, []);

  // ── Critical path toggle ──────────────────────────────────────────────
  const displayEdges = criticalOnly
    ? edges.map(e => {
        // Find source node
        const sourceNode = nodes.find(n => n.id === e.source);
        const d = sourceNode?.data as AgentFlowNodeData | undefined;
        const isCritical = (d?.score !== undefined && d.score < 70) ||
                           (d?.risk  !== undefined && d.risk  > 70);
        return {
          ...e,
          style: {
            ...e.style,
            opacity: isCritical ? 1 : 0.15,
            strokeWidth: isCritical ? 2.5 : 0.5,
          },
          animated: isCritical ? true : false,
        };
      })
    : edges;

  // ── PNG export via html-to-image ──────────────────────────────────────
  const handleExportPNG = async () => {
    setExporting(true);
    try {
      // Dynamically import html-to-image (optional dep)
      const { toPng } = await import('html-to-image').catch(() => ({ toPng: null }));
      if (!toPng) {
        alert('Install html-to-image: npm install html-to-image');
        return;
      }
      if (!flowRef.current) return;
      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: '#0B0E17',
        quality: 0.95,
      });
      const link = document.createElement('a');
      link.download = `agent-flow-${projectId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (initialNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-card-3 flex items-center justify-center">
          🤖
        </div>
        <p className="text-sm">No agent activity yet</p>
        <p className="text-xs opacity-60">Run a review to see the flow</p>
      </div>
    );
  }

  return (
    <div ref={flowRef} className={cn('h-full w-full relative', realtimePulse && 'ring-1 ring-chart-2/50 transition-shadow')}>
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={null}   // prevent accidental deletes
        proOptions={{ hideAttribution: true }}
      >
        {/* Dark grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          color="#1E2538"
          gap={20}
          size={1.2}
        />

        {/* Minimap */}
        <MiniMap
          nodeColor={(n) => {
            const t = (n.data as AgentFlowNodeData)?.type;
            return t === 'agent' ? '#00A896' : t === 'skill' ? '#D4AF37' : t === 'tool' ? '#C084FC' : '#4ADE80';
          }}
          style={{
            background: '#0F1320',
            border:     '1px solid #1E2538',
            borderRadius: 8,
          }}
          maskColor="rgba(11,14,23,0.7)"
        />

        {/* Built-in controls */}
        <Controls
          style={{
            background: '#0F1320',
            border:     '1px solid #1E2538',
            borderRadius: 8,
          }}
        />

        {/* Custom toolbar panel */}
        <Panel position="top-left">
          <div className="flex items-center gap-2">
            {/* Critical path toggle */}
            <button
              onClick={() => setCriticalOnly(v => !v)}
              className={cn(
                'flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all',
                criticalOnly
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'glass border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Filter className="h-3 w-3" />
              {criticalOnly ? 'Critical path' : 'All paths'}
            </button>

            {/* Fit view */}
            <button
              onClick={() => fitView({ padding: 0.15, duration: 500 })}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg ardeno-panel border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Maximize2 className="h-3 w-3" />
              Fit View
            </button>

            {/* Export PNG */}
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg ardeno-panel border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export PNG
            </button>
          </div>
        </Panel>

        {/* Realtime update indicator */}
        {realtimePulse && (
          <Panel position="top-right">
            <div className="flex items-center gap-1.5 ardeno-panel border border-chart-2/30 rounded-lg px-2.5 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-chart-2 animate-pulse" />
              <span className="text-chart-2 text-[10px] font-medium">Live update</span>
            </div>
          </Panel>
        )}

        {/* Legend */}
        <Panel position="bottom-left">
          <div className="ardeno-panel border border-border rounded-xl px-3 py-2 space-y-1">
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1.5">Legend</p>
            {[
              { color: '#00A896', label: 'Agent' },
              { color: '#D4AF37', label: 'Skill' },
              { color: '#C084FC', label: 'Tool' },
              { color: '#4ADE80', label: 'Product' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>

      {/* Node detail dialog */}
      <NodeDetailDialog
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

// ─── Public component (wrapped in ReactFlowProvider) ──────────────────────

interface AgentFlowGraphProps {
  projectId: string;
  height?:   number | string;
  className?: string;
}

export function AgentFlowGraph({ projectId, height = 480, className }: AgentFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <div
        className={cn('w-full rounded-xl overflow-hidden border border-border', className)}
        style={{ height, background: '#0B0E17' }}
      >
        <AgentFlowInner projectId={projectId} />
      </div>
    </ReactFlowProvider>
  );
}

// ─── Full-screen dialog version ───────────────────────────────────────────

interface AgentFlowDialogProps {
  projectId:  string;
  projectTitle: string;
  trigger:    React.ReactNode;
}

export function AgentFlowDialog({ projectId, projectTitle, trigger }: AgentFlowDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed inset-4 z-50 flex flex-col ardeno-panel rounded-2xl border border-border shadow-2xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              <Dialog.Title className="text-foreground font-semibold text-sm">Agent Flow Graph</Dialog.Title>
              <p className="text-muted-foreground text-xs mt-0.5">{projectTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-chart-2 text-[10px]">
                <div className="h-1.5 w-1.5 rounded-full bg-chart-2 animate-pulse" />
                Realtime
              </div>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* Flow graph */}
          <div className="flex-1 overflow-hidden">
            <AgentFlowGraph projectId={projectId} height="100%" />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border shrink-0 flex items-center gap-3">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground text-[11px]">
              Drag nodes to rearrange — positions are saved locally. Click a node for details. Edges animate when activity is recent (&lt;1h).
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
