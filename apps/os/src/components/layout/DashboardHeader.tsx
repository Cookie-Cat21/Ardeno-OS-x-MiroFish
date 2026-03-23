import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Globe, Crown, ShieldAlert,
  Zap, ChevronRight,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { useUserRole } from '@/hooks/useUserRole';
import { useSecurityScans } from '@/hooks/useSecurityScans';
import { useProjects } from '@/hooks/useProjects';
import { UserRoleManager } from '@/components/UserRoleManager';
import { CommandPalette } from '@/components/ui/CommandPalette';

// ─── Page metadata (title + badge + subtitle per route) ─────────────────────

interface PageMeta {
  title:    string;
  badge:    string;
  subtitle: string;
}

const PAGE_META: Record<string, PageMeta> = {
  '/':              { title: 'Dashboard',      badge: 'OVERVIEW',             subtitle: 'Monitor your agents, pipeline, and system health at a glance.'          },
  '/intelligence':  { title: 'Intelligence',   badge: 'AI INSIGHTS',          subtitle: 'Advanced AI analytics and intelligence layer for Ardeno OS.'             },
  '/analytics':     { title: 'Analytics',      badge: 'PERFORMANCE',          subtitle: 'Deep dive into system metrics, usage patterns, and key trends.'          },
  '/projects':      { title: 'Pipeline',       badge: 'PROJECT MANAGEMENT',   subtitle: 'Manage and track your AI-assisted project pipeline end to end.'          },
  '/agents':        { title: 'Agents',         badge: 'AI WORKFORCE',         subtitle: 'Monitor and manage your deployed AI agent roster.'                       },
  '/agent-manager': { title: 'Agent Manager',  badge: 'OPERATIONAL SURFACE',  subtitle: 'Shape your internal agent roster, prompts, and capabilities.'            },
  '/orchestrator':  { title: 'Orchestrator',   badge: 'WORKFLOW ENGINE',      subtitle: 'Design and orchestrate complex multi-agent execution flows.'              },
  '/skills':        { title: 'Skills',         badge: 'CAPABILITY LAYER',     subtitle: 'Configure and curate the skills available to your agent workforce.'      },
  '/skills-usage':  { title: 'Skills Usage',   badge: 'METRICS',              subtitle: 'Track skill utilization rates and performance across all agents.'         },
  '/analyzer':      { title: 'Analyzer',       badge: 'DATA ANALYSIS',        subtitle: 'Analyze outputs, extract insights, and surface data patterns.'           },
  '/site-builder':  { title: 'Site Builder',   badge: 'VISUAL EDITOR',        subtitle: 'Build and deploy client-facing sites with AI assistance.'                },
  '/security':      { title: 'Security',       badge: 'PROTECTION LAYER',     subtitle: 'Monitor, scan, and respond to vulnerability threats in real time.'       },
  '/telegram':      { title: 'Telegram Bridge',badge: 'MESSAGING',            subtitle: 'Configure your Telegram bot integration and notification routing.'       },
  '/activity':      { title: 'Activity Log',   badge: 'AUDIT TRAIL',          subtitle: 'Full chronological record of all system actions and agent events.'       },
  '/settings':      { title: 'Settings',       badge: 'CONFIGURATION',        subtitle: 'Configure your Ardeno OS environment, integrations, and preferences.'   },
  '/admin/roles':   { title: 'Role Manager',   badge: 'ACCESS CONTROL',       subtitle: 'Manage user roles, permissions, and access levels across the system.'   },
};

function getPageMeta(pathname: string): PageMeta {
  return PAGE_META[pathname] ?? { title: 'Ardeno OS', badge: 'SYSTEM', subtitle: 'Internal AI operating system for Ardeno Studio.' };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardHeader() {
  const { user, signOut }       = useAuth();
  const { lang, setLang }       = useI18n();
  const { data: role }          = useUserRole();
  const { data: projects = [] } = useProjects();
  const { data: scans = [] }    = useSecurityScans();
  const location                = useLocation();
  const navigate                = useNavigate();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [alertsOpen,  setAlertsOpen]  = useState(false);

  const isAdmin   = role === 'admin';
  const meta      = getPageMeta(location.pathname);
  const username  = user?.email?.split('@')[0] ?? 'dev';
  const initial   = user?.email?.slice(0, 1).toUpperCase() ?? 'D';

  // Alerts
  const pendingApprovals = projects.filter(p => p.stage === 'Deploy' && (p.consensus_score ?? 0) < 80);
  const recentCritical   = scans.filter(s => {
    const age = Date.now() - new Date(s.scan_timestamp).getTime();
    return s.vulns_found > 0 && age < 86_400_000;
  });
  const totalAlerts = pendingApprovals.length + recentCritical.length;

  return (
    <>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/90 backdrop-blur-sm flex-shrink-0 min-h-[64px]">

        {/* ── Left: breadcrumb + title + badge + subtitle ── */}
        <div className="min-w-0 mr-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase">
              ARDENO STUDIO
            </span>
            <ChevronRight size={9} className="text-muted-foreground/40" />
            <span className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase">
              OS
            </span>
          </div>

          {/* Title + badge row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[18px] font-bold text-foreground tracking-tight leading-none">
              {meta.title}
            </h1>
            <span className="page-badge">{meta.badge}</span>
          </div>

          {/* Subtitle */}
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-none truncate max-w-lg">
            {meta.subtitle}
          </p>
        </div>

        {/* ── Right: actions ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Search bar (opens command palette) */}
          <button
            onClick={() => setPaletteOpen(true)}
            className={cn(
              'flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-lg text-xs text-muted-foreground',
              'bg-card-2 border border-border',
              'hover:border-primary/30 hover:text-foreground transition-all duration-200',
              'min-w-[220px]'
            )}
          >
            <Search size={13} className="flex-shrink-0" />
            <span className="hidden sm:inline flex-1 text-left">Search workspace</span>
            <kbd className="hidden sm:inline ml-1 px-1.5 py-0.5 rounded text-[9px] bg-card-3 text-muted-foreground/70 font-mono border border-border">
              ⌘K
            </kbd>
          </button>

          {/* Admin: Role Manager */}
          {isAdmin && <UserRoleManager />}

          {/* Lightning / AI commands */}
          <button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-3 transition-colors"
            title="AI Commands"
          >
            <Zap size={15} />
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => { setAlertsOpen(v => !v); setLangOpen(false); }}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-3 transition-colors"
            >
              <Bell size={15} />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {alertsOpen && (
              <div className="absolute right-0 top-10 z-50 ardeno-panel border border-border rounded-xl shadow-2xl w-72 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-foreground text-xs font-semibold">Alerts</span>
                  <span className="text-muted-foreground text-[10px]">{totalAlerts} pending</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {totalAlerts === 0 ? (
                    <p className="text-muted-foreground text-xs text-center py-6">All clear</p>
                  ) : (
                    <>
                      {pendingApprovals.map(p => (
                        <button key={p.id} onClick={() => { setAlertsOpen(false); navigate('/projects'); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-card-2 transition-colors border-b border-border/40 last:border-0 text-left">
                          <Crown size={13} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-foreground text-xs font-medium">Deployment Needs Approval</p>
                            <p className="text-muted-foreground text-[11px] mt-0.5 truncate">{p.title}</p>
                            <p className="text-primary text-[10px] mt-0.5">Consensus: {p.consensus_score ?? 0}% — below 80%</p>
                          </div>
                        </button>
                      ))}
                      {recentCritical.map(s => (
                        <button key={s.id} onClick={() => { setAlertsOpen(false); navigate('/security'); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-card-2 transition-colors border-b border-border/40 last:border-0 text-left">
                          <ShieldAlert size={13} className="text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-foreground text-xs font-medium">Security Scan Alert</p>
                            <p className="text-muted-foreground text-[11px] mt-0.5">{s.vulns_found} vulnerabilities found</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ONLINE badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card-2 border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider hidden sm:inline">ONLINE</span>
          </div>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(v => !v); setAlertsOpen(false); }}
              className="flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-3 transition-colors"
              title="Switch language"
            >
              <Globe size={14} />
              <span className="hidden sm:inline text-[9px] font-mono uppercase">{lang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-10 z-50 ardeno-panel border border-border rounded-xl shadow-2xl overflow-hidden w-28">
                {(['en', 'si'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
                      lang === l
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card-2'
                    )}
                  >
                    <span>{l === 'en' ? '🇬🇧' : '🇱🇰'}</span>
                    <span>{l === 'en' ? 'English' : 'Sinhala'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar + dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-all duration-200',
                  'bg-card-2 border border-border hover:border-primary/30',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
                )}
              >
                {/* Avatar circle */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: 'rgba(234,88,12,0.85)' }}
                >
                  {initial}
                </div>
                <div className="hidden sm:block text-left leading-none">
                  <p className="text-[11px] font-semibold text-foreground">{username}</p>
                  <p className="text-[9px] text-muted-foreground">Ardeno Studio</p>
                </div>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="w-52 rounded-xl p-1 z-50 ardeno-panel border border-border shadow-2xl animate-fade-in"
              >
                <div className="px-3 py-2 mb-1 border-b border-border">
                  <p className="text-xs font-medium text-foreground truncate">{user?.email ?? 'dev@ardeno.studio'}</p>
                  <p className={cn(
                    'text-[10px] font-mono mt-0.5 flex items-center gap-1',
                    isAdmin ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {isAdmin && <Crown size={8} />}
                    {isAdmin ? 'FOUNDER ACCESS' : (role ?? 'user').toUpperCase()}
                  </p>
                </div>

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                <DropdownMenu.Item
                  onSelect={signOut}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                >
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Click-outside dismissal */}
        {(langOpen || alertsOpen) && (
          <div className="fixed inset-0 z-40" onClick={() => { setLangOpen(false); setAlertsOpen(false); }} />
        )}
      </header>
    </>
  );
}
