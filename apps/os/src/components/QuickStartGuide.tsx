import { useState } from 'react';
import { ChevronDown, ChevronUp, Rocket, Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STEPS = [
  { n: 1, emoji: '✨', label: 'Create a Project',      desc: 'Click "New Project" on the Pipeline page → fill in client name & title' },
  { n: 2, emoji: '🎨', label: 'Generate Moodboard',    desc: 'Drag project to Quote/Design → open card menu → Generate Moodboard via Canva' },
  { n: 3, emoji: '🤖', label: 'Drag to Build',         desc: 'Drag to Build stage → agent review auto-triggers + edge function runs' },
  { n: 4, emoji: '🛡️', label: 'Security Stage',        desc: 'Drag to Security → run security scan → check for vulnerabilities' },
  { n: 5, emoji: '📤', label: 'Deploy & Approve',      desc: 'Drag to Deploy → if consensus <80% → Telegram alert sent for approval' },
  { n: 6, emoji: '✅', label: 'Done & Export',         desc: 'Mark as Done → export full PDF report from Project Detail page' },
];

export function QuickStartGuide() {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { data: projects = [] } = useProjects();

  async function handleDemoReset() {
    const demoProjects = projects.filter(p =>
      p.client_name.toLowerCase().includes('demo') ||
      p.title.toLowerCase().includes('demo') ||
      p.title.toLowerCase().includes('test')
    );

    if (demoProjects.length === 0) {
      toast.info('No demo/test projects found to delete');
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', demoProjects.map(p => p.id));
      if (error) throw error;
      toast.success(`Deleted ${demoProjects.length} demo project(s)`);
    } catch (err) {
      toast.error('Demo reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="ardeno-panel rounded-xl border border-chart-2/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-card-3/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-chart-2" />
          <p className="text-foreground text-sm font-semibold">Quick-Start Guide</p>
          <span className="text-[10px] bg-chart-2/10 text-chart-2 px-2 py-0.5 rounded-full border border-chart-2/20">
            6 steps
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Steps */}
      {open && (
        <div className="px-5 pb-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {STEPS.map(step => (
              <div key={step.n} className="flex items-start gap-3 p-3 rounded-lg bg-card-3 border border-border">
                <div className="h-6 w-6 rounded-full bg-chart-2/10 border border-chart-2/20 flex items-center justify-center text-[11px] font-bold text-chart-2 shrink-0">
                  {step.n}
                </div>
                <div>
                  <p className="text-foreground text-xs font-semibold">{step.emoji} {step.label}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-muted-foreground text-xs">
              Each step triggers realtime updates, toasts, Telegram messages, and audit logs.
            </p>
            <button
              onClick={handleDemoReset}
              disabled={resetting}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Demo Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
