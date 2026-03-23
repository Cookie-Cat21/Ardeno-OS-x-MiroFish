/**
 * Ardeno OS — useAgentFlowData
 * Transforms Supabase data (agent reviews, audit logs, skill usages, commits)
 * into React Flow nodes and edges for the interactive Agent Flow Graph.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Node, Edge } from 'reactflow';
import { useProjectReviews } from '@/hooks/useAgentReviews';
import { useSkills }         from '@/hooks/useSkills';
import { supabase }          from '@/lib/supabase';
import type { AuditLog }     from '@/types';

/** Project-scoped audit logs for Agent Flow Graph */
function useProjectAuditLogs(projectId: string | undefined) {
  return useQuery({
    queryKey: ['audit-logs', projectId],
    queryFn:  async () => {
      if (!projectId) return [] as AuditLog[];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
    enabled:   !!projectId,
    staleTime: 30_000,
  });
}

// ─── Node/Edge metadata shapes ─────────────────────────────────────────────

export type NodeType = 'agent' | 'skill' | 'tool' | 'product';

export interface AgentFlowNodeData {
  label:      string;
  type:       NodeType;
  score?:     number;       // consensus or success_rate
  risk?:      number;
  timestamp?: string;
  reasoning?: string;
  icon:       string;
  category?:  string;
  usageCount?: number;
}

// Reasonable grid positions for initial layout
const AGENT_X = 80;
const SKILL_X = 340;
const TOOL_X  = 600;
const PROD_X  = 860;
const ROW_H   = 100;

// Well-known tool icons
const TOOL_META: Record<string, { icon: string; label: string }> = {
  canva:   { icon: '🎨', label: 'Canva Design' },
  github:  { icon: '🐙', label: 'GitHub Repo' },
  pdf:     { icon: '📄', label: 'PDF Export' },
  telegram:{ icon: '✈️', label: 'Telegram Bot' },
};

// Agent icons by name
function agentIcon(name: string): string {
  if (name.toLowerCase().includes('security'))  return '🛡️';
  if (name.toLowerCase().includes('frontend'))  return '🖥️';
  if (name.toLowerCase().includes('lead'))      return '👑';
  return '🤖';
}

// ─── Main hook ─────────────────────────────────────────────────────────────

export function useAgentFlowData(projectId: string | undefined) {
  const { data: reviews   = [] } = useProjectReviews(projectId ?? '');
  const { data: auditLogs = [] } = useProjectAuditLogs(projectId);
  const { data: allSkills = [] } = useSkills();

  return useMemo(() => {
    if (!projectId) return { nodes: [], edges: [] };

    const nodes: Node<AgentFlowNodeData>[] = [];
    const edges: Edge[]                     = [];
    const nodeIds = new Set<string>();

    function addNode(node: Node<AgentFlowNodeData>) {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        nodes.push(node);
      }
    }

    function addEdge(edge: Edge) {
      if (!edges.find(e => e.id === edge.id)) {
        edges.push(edge);
      }
    }

    // ── 1. Agent nodes (from reviews) ────────────────────────────────────
    const agentNames = [...new Set(reviews.map(r => r.agent_name).filter(Boolean))];
    agentNames.forEach((name, i) => {
      const agentReviews = reviews.filter(r => r.agent_name === name);
      const latestReview = agentReviews.at(-1);
      const avgConsensus = agentReviews.length > 0
        ? Math.round(agentReviews.reduce((s, r) => s + (r.consensus_score ?? 0), 0) / agentReviews.length)
        : undefined;
      const latestRisk   = latestReview?.risk_score;

      addNode({
        id:       `agent-${name}`,
        type:     'agentFlowNode',
        position: { x: AGENT_X, y: 60 + i * ROW_H },
        data: {
          label:     name,
          type:      'agent',
          score:     avgConsensus,
          risk:      latestRisk,
          timestamp: latestReview?.created_at,
          reasoning: latestReview?.notes ?? undefined,
          icon:      agentIcon(name),
          category:  name,
        },
      });
    });

    // ── 2. Skill nodes (from audit logs meta + skill_usages) ──────────────
    // Extract skills referenced in audit_logs meta (agent_review actions)
    const usedSkillCategories = new Set<string>();
    const usedSkillIds        = new Set<string>();

    for (const log of auditLogs) {
      const meta = log.meta as Record<string, unknown> | null;
      if (!meta) continue;
      if (log.action === 'agent_review') {
        const cats = meta.skill_categories as string[] | undefined;
        cats?.forEach(c => usedSkillCategories.add(c));
      }
    }

    // Match skill categories to actual skills
    const relevantSkills = allSkills.filter(
      sk => usedSkillCategories.has(sk.category ?? '')
    );

    // Also pick top 3 skills by usage_count as additional context
    const topSkills = [...allSkills]
      .sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0))
      .slice(0, 3);

    const skillsToShow = [
      ...relevantSkills,
      ...topSkills.filter(s => !relevantSkills.find(r => r.id === s.id)),
    ].slice(0, 8);

    skillsToShow.forEach((skill, i) => {
      usedSkillIds.add(skill.id);
      addNode({
        id:       `skill-${skill.id}`,
        type:     'agentFlowNode',
        position: { x: SKILL_X, y: 40 + i * ROW_H },
        data: {
          label:     skill.name,
          type:      'skill',
          score:     skill.success_rate ?? 0,
          icon:      skill.category === 'Security' ? '🔐'
                   : skill.category === 'Frontend'  ? '🖥️'
                   : skill.category === 'Backend'   ? '⚙️'
                   : skill.category === 'DevOps'    ? '🚀'
                   : skill.category === 'Design'    ? '🎨'
                   : '🧠',
          category:  skill.category ?? '',
          usageCount: skill.usage_count ?? 0,
        },
      });
    });

    // ── 3. Tool nodes (from audit_logs actions) ───────────────────────────
    const toolsFound = new Set<string>();
    for (const log of auditLogs) {
      if (log.action === 'pdf_exported')           toolsFound.add('pdf');
      if (log.action === 'canva_design_created')   toolsFound.add('canva');
      if (log.action === 'github_commit')          toolsFound.add('github');
      if (log.action === 'telegram_notification')  toolsFound.add('telegram');
    }
    // Always show GitHub + Canva if any reviews exist
    if (reviews.length > 0) { toolsFound.add('github'); toolsFound.add('canva'); }

    const toolList = [...toolsFound];
    toolList.forEach((tool, i) => {
      const meta = TOOL_META[tool] ?? { icon: '🔧', label: tool };
      addNode({
        id:       `tool-${tool}`,
        type:     'agentFlowNode',
        position: { x: TOOL_X, y: 60 + i * ROW_H },
        data: {
          label: meta.label,
          type:  'tool',
          icon:  meta.icon,
        },
      });
    });

    // ── 4. Product / final node ───────────────────────────────────────────
    const latestReview  = reviews.at(-1);
    const finalConsensus = latestReview?.consensus_score;
    const midY = Math.max(agentNames.length, skillsToShow.length, toolList.length) * ROW_H / 2 + 20;

    addNode({
      id:       'project-end',
      type:     'agentFlowNode',
      position: { x: PROD_X, y: midY },
      data: {
        label:     'Project Outcome',
        type:      'product',
        score:     finalConsensus,
        icon:      '🏁',
        timestamp: latestReview?.created_at,
      },
    });

    // ── 5. Agent → Skill edges ────────────────────────────────────────────
    agentNames.forEach(agentName => {
      skillsToShow.forEach(skill => {
        // Connect agent to skill if their category matches (Frontend → Frontend skills, etc.)
        const agentCat = agentName.split(' ')[0]; // "Frontend", "Security", "Lead"
        if (
          skill.category === agentCat ||
          (agentName.includes('Lead') && skill.category === 'Backend')
        ) {
          const isRecent = !!reviews.find(
            r => r.agent_name === agentName &&
            r.created_at && Date.now() - new Date(r.created_at).getTime() < 3_600_000
          );
          addEdge({
            id:        `e-agent-${agentName}-skill-${skill.id}`,
            source:    `agent-${agentName}`,
            target:    `skill-${skill.id}`,
            animated:   isRecent,
            label:     skill.usage_count ? `${skill.usage_count}×` : undefined,
            style:     { stroke: '#00A896', strokeWidth: 1.5 },
            labelStyle: { fill: '#8892A4', fontSize: 9 },
            type:      'smoothstep',
          });
        }
      });
    });

    // ── 6. Skill → Tool edges ─────────────────────────────────────────────
    skillsToShow.forEach((skill, i) => {
      toolList.forEach(tool => {
        // Design skills connect to Canva; Security to any tool; others to GitHub
        const connects =
          (skill.category === 'Design'   && tool === 'canva')   ||
          (skill.category === 'Frontend' && tool === 'github')  ||
          (skill.category === 'Backend'  && tool === 'github')  ||
          (skill.category === 'Security' && (tool === 'github' || tool === 'telegram')) ||
          (skill.category === 'DevOps'   && tool === 'github');

        if (connects) {
          addEdge({
            id:     `e-skill-${skill.id}-tool-${tool}`,
            source: `skill-${skill.id}`,
            target: `tool-${tool}`,
            style:  { stroke: '#4ADE80', strokeWidth: 1.5 },
            type:   'smoothstep',
          });
        }
      });
    });

    // ── 7. Tool → Product edges ───────────────────────────────────────────
    toolList.forEach(tool => {
      addEdge({
        id:       `e-tool-${tool}-product`,
        source:   `tool-${tool}`,
        target:   'project-end',
        animated:  true,
        style:    { stroke: '#D4AF37', strokeWidth: 2 },
        type:     'smoothstep',
      });
    });

    // ── 8. Agent → Product direct edges (if no tools) ─────────────────────
    if (toolList.length === 0) {
      agentNames.forEach(agentName => {
        addEdge({
          id:       `e-agent-${agentName}-product`,
          source:   `agent-${agentName}`,
          target:   'project-end',
          animated:  true,
          style:    { stroke: '#D4AF37', strokeWidth: 2 },
          type:     'smoothstep',
        });
      });
    }

    return { nodes, edges };
  }, [projectId, reviews, auditLogs, allSkills]);
}
