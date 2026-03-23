/**
 * ComingSoonPage — placeholder for routes not yet implemented.
 * Shown for: /intelligence, /agent-manager, /orchestrator, /analyzer, /site-builder
 */
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const PAGE_LABELS: Record<string, { emoji: string; label: string; desc: string }> = {
  '/intelligence':  { emoji: '✨', label: 'Intelligence',   desc: 'Advanced AI analytics and intelligence layer — coming soon.'             },
  '/agent-manager': { emoji: '👥', label: 'Agent Manager',  desc: 'Build and govern your Ardeno AI workforce — coming soon.'                },
  '/orchestrator':  { emoji: '🔀', label: 'Orchestrator',   desc: 'Design and manage complex multi-agent orchestration flows — coming soon.' },
  '/analyzer':      { emoji: '🔍', label: 'Analyzer',       desc: 'Analyze outputs and extract data insights from your agents — coming soon.' },
  '/site-builder':  { emoji: '🌐', label: 'Site Builder',   desc: 'Build and deploy client-facing sites with AI assistance — coming soon.'   },
};

export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const meta = PAGE_LABELS[pathname] ?? { emoji: '🚧', label: 'Coming Soon', desc: 'This page is under construction.' };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
        style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)' }}
      >
        {meta.emoji}
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">{meta.label}</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">{meta.desc}</p>

      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono"
        style={{ background: 'rgba(234,88,12,0.10)', color: '#EA580C', border: '1px solid rgba(234,88,12,0.25)' }}
      >
        <Sparkles size={12} />
        IN DEVELOPMENT
      </div>
    </div>
  );
}
