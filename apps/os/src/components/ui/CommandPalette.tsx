import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Brain, Bot, MessageSquare,
  ScrollText, Settings, Plus, RefreshCw, FileText, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id:       string;
  label:    string;
  icon:     React.ReactNode;
  shortcut?: string;
  action:   () => void;
}

interface CommandPaletteProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate  = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const COMMANDS: Command[] = [
    {
      id: 'dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard className="h-4 w-4" />,
      shortcut: '1', action: () => { navigate('/'); onOpenChange(false); },
    },
    {
      id: 'pipeline', label: 'Open Pipeline', icon: <Kanban className="h-4 w-4" />,
      shortcut: '2', action: () => { navigate('/projects'); onOpenChange(false); },
    },
    {
      id: 'skills', label: 'View Skills Registry', icon: <Brain className="h-4 w-4" />,
      shortcut: '3', action: () => { navigate('/skills'); onOpenChange(false); },
    },
    {
      id: 'agents', label: 'Agent Performance', icon: <Bot className="h-4 w-4" />,
      shortcut: '4', action: () => { navigate('/agents'); onOpenChange(false); },
    },
    {
      id: 'telegram', label: 'Telegram Bridge', icon: <MessageSquare className="h-4 w-4" />,
      shortcut: '5', action: () => { navigate('/telegram'); onOpenChange(false); },
    },
    {
      id: 'activity', label: 'Activity Log', icon: <ScrollText className="h-4 w-4" />,
      shortcut: '6', action: () => { navigate('/activity'); onOpenChange(false); },
    },
    {
      id: 'new-project', label: 'New Project', icon: <Plus className="h-4 w-4" />,
      action: () => {
        navigate('/projects');
        // Dispatch event to open the NewProjectForm dialog
        window.dispatchEvent(new CustomEvent('open-new-project'));
        onOpenChange(false);
      },
    },
    {
      id: 'review-all', label: 'Review All Projects', icon: <RefreshCw className="h-4 w-4" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('review-all-projects'));
        onOpenChange(false);
      },
    },
    {
      id: 'export-pdf', label: 'Export Proposal PDF', icon: <FileText className="h-4 w-4" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('export-all-pdf'));
        onOpenChange(false);
      },
    },
    {
      id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />,
      action: () => { navigate('/settings'); onOpenChange(false); },
    },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 ardeno-panel rounded-xl border border-border shadow-xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-muted-foreground text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && filtered[0]) filtered[0].action();
            }}
          />
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No commands found</p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground',
                  'hover:bg-card-3 hover:text-foreground transition-colors text-left'
                )}
              >
                <span className="text-primary">{cmd.icon}</span>
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="rounded bg-border px-1.5 py-0.5 text-[10px] font-mono">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
