/**
 * AgentManagerPage — matches the original Ardeno OS "Agent Manager" page.
 * "Build and govern the Ardeno AI workforce."
 * Shows the full roster of built-in specialist agents.
 */
import { useState } from 'react';
import { Plus, Bot, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Built-in agent roster (21 core profiles) ───────────────────────────────

interface AgentProfile {
  id:          string;
  name:        string;
  description: string;
  provider:    string;
  model:       string;
  category:    string;
  isActive:    boolean;
  isCustom:    boolean;
}

const BUILT_IN_AGENTS: AgentProfile[] = [
  { id: '1',  name: 'Orchestrator Prime',     description: 'Master coordinator, breaks down complex tasks and delegates',        provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Coordination', isActive: true,  isCustom: false },
  { id: '2',  name: 'Orchestrator Backup',    description: 'Failover coordinator when Prime is busy',                           provider: 'OPENROUTER', model: 'QWEN3-32B',                         category: 'Coordination', isActive: true,  isCustom: false },
  { id: '3',  name: 'Copywriter',             description: 'Website copy, headlines, taglines, CTAs, about pages',              provider: 'OPENROUTER', model: 'LLAMA-4-MAVERICK',                  category: 'Content',      isActive: true,  isCustom: false },
  { id: '4',  name: 'Proposal Writer',        description: 'Client proposals, service packages, pricing decks',                 provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Content',      isActive: true,  isCustom: false },
  { id: '5',  name: 'Social Media Writer',    description: 'Instagram, LinkedIn, Facebook content',                            provider: 'OPENROUTER', model: 'LLAMA-4-MAVERICK',                  category: 'Content',      isActive: true,  isCustom: false },
  { id: '6',  name: 'Email Outreach',         description: 'Cold emails, follow-ups, client communications',                   provider: 'OPENROUTER', model: 'MISTRAL-SMALL-3.1-24B-INSTRUCT',    category: 'Outreach',     isActive: true,  isCustom: false },
  { id: '7',  name: 'Lead Qualifier',         description: 'Scores and qualifies incoming leads from all channels',            provider: 'OPENROUTER', model: 'QWEN3-32B',                         category: 'Sales',        isActive: true,  isCustom: false },
  { id: '8',  name: 'Client Support',         description: 'Handles client queries, project status updates',                   provider: 'OPENROUTER', model: 'LLAMA-4-MAVERICK',                  category: 'Support',      isActive: true,  isCustom: false },
  { id: '9',  name: 'Frontend Developer',     description: 'Builds UI components, implements designs in React/Tailwind',        provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Engineering',  isActive: false, isCustom: false },
  { id: '10', name: 'Backend Developer',      description: 'API development, database design, server-side logic',              provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Engineering',  isActive: false, isCustom: false },
  { id: '11', name: 'DevOps Engineer',        description: 'CI/CD pipelines, deployment automation, infrastructure',           provider: 'OPENROUTER', model: 'QWEN3-32B',                         category: 'Engineering',  isActive: false, isCustom: false },
  { id: '12', name: 'Security Auditor',       description: 'Scans for vulnerabilities, enforces security protocols',           provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Security',     isActive: false, isCustom: false },
  { id: '13', name: 'SEO Specialist',         description: 'Keyword research, on-page optimisation, technical SEO',            provider: 'OPENROUTER', model: 'LLAMA-4-MAVERICK',                  category: 'Marketing',    isActive: false, isCustom: false },
  { id: '14', name: 'Analytics Reporter',     description: 'Generates performance reports, tracks KPIs and metrics',           provider: 'OPENROUTER', model: 'MISTRAL-SMALL-3.1-24B-INSTRUCT',    category: 'Analytics',    isActive: false, isCustom: false },
  { id: '15', name: 'Content Strategist',     description: 'Plans editorial calendars, content pillars, campaign briefs',      provider: 'OPENROUTER', model: 'LLAMA-4-MAVERICK',                  category: 'Content',      isActive: false, isCustom: false },
  { id: '16', name: 'Brand Designer',         description: 'Visual identity, brand guidelines, design system maintenance',     provider: 'OPENROUTER', model: 'QWEN3-32B',                         category: 'Design',       isActive: false, isCustom: false },
  { id: '17', name: 'Technical Writer',       description: 'Documentation, API references, user guides, changelogs',           provider: 'OPENROUTER', model: 'MISTRAL-SMALL-3.1-24B-INSTRUCT',    category: 'Content',      isActive: false, isCustom: false },
  { id: '18', name: 'Data Analyst',           description: 'Processes datasets, surfaces insights, builds dashboards',         provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Analytics',    isActive: false, isCustom: false },
  { id: '19', name: 'QA Tester',              description: 'Automated testing, regression checks, bug triage',                 provider: 'OPENROUTER', model: 'QWEN3-32B',                         category: 'Engineering',  isActive: false, isCustom: false },
  { id: '20', name: 'Project Manager',        description: 'Task coordination, sprint planning, stakeholder updates',          provider: 'OPENROUTER', model: 'LLAMA-4-MAVERICK',                  category: 'Coordination', isActive: false, isCustom: false },
  { id: '21', name: 'Business Analyst',       description: 'Requirements gathering, process mapping, ROI analysis',            provider: 'OPENROUTER', model: 'DEEPSEEK-R1',                       category: 'Strategy',     isActive: false, isCustom: false },
];

// ─── Agent card ──────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <div className={cn(
      'group relative rounded-xl p-4 border transition-all duration-200',
      'bg-card-2/60 hover:bg-card-2',
      'border-border hover:border-primary/20',
    )}>
      <div className="flex items-start gap-3">
        {/* Orange robot icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.25)' }}
        >
          <Bot size={16} style={{ color: '#EA580C' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-bold text-foreground">{agent.name}</p>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-card-3 text-muted-foreground border border-border">
              {agent.provider}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {agent.description}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] font-mono text-muted-foreground/60 tracking-wider">
              {agent.model}
            </span>
            <span className={cn(
              'flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full',
              agent.isActive
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-muted-foreground/50 bg-card-3'
            )}>
              <span className={cn('w-1 h-1 rounded-full', agent.isActive ? 'bg-emerald-400' : 'bg-muted/40')} />
              {agent.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AgentManagerPage() {
  const [search, setSearch] = useState('');

  const builtIn  = BUILT_IN_AGENTS.filter(a => !a.isCustom);
  const custom   = BUILT_IN_AGENTS.filter(a => a.isCustom);
  const enabled  = BUILT_IN_AGENTS.filter(a => a.isActive);

  const filtered = BUILT_IN_AGENTS.filter(a =>
    search.trim() === '' ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="rounded-2xl p-6 border border-border overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.06) 0%, rgba(14,16,24,0.95) 60%)' }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #EA580C 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />

        <div className="relative">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(234,88,12,0.9)', boxShadow: '0 0 12px rgba(234,88,12,0.4)' }}
            >
              <span className="text-white font-black text-sm">A</span>
            </div>
            <span className="page-badge">AGENT GOVERNANCE</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Build and govern the Ardeno AI workforce.
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Configure specialist agents with stronger prompts, cleaner models, and reusable skills so
            every system in Ardeno OS feels intentional.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-5">
            {[
              { label: 'BUILT IN',  value: builtIn.length  },
              { label: 'CUSTOM',    value: custom.length   },
              { label: 'ENABLED',   value: enabled.length  },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Registry header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-mono text-muted-foreground tracking-[0.3em] uppercase mb-1">
            AGENT REGISTRY
          </p>
          <p className="text-xs text-muted-foreground/70">
            Curate built-in specialists and extend the system with your own agents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60 px-2 py-1 rounded-lg bg-card-2 border border-border">
            {builtIn.length} Core Profiles
          </span>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: '#EA580C', boxShadow: '0 0 12px rgba(234,88,12,0.3)' }}
          >
            <Plus size={13} />
            New Agent
          </button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search agents by name, role, or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-xs bg-card-2 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      {/* ── Built-in agents grid ─────────────────────────────── */}
      <div>
        <p className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.3em] uppercase mb-3">
          BUILT-IN AGENTS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.filter(a => !a.isCustom).map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* ── Custom agents ────────────────────────────────────── */}
      {custom.length > 0 && (
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.3em] uppercase mb-3">
            CUSTOM AGENTS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.filter(a => a.isCustom).map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
