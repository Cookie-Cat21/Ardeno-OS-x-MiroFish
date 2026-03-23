import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Sparkles, BarChart3,
  Bot, Users2, Workflow, Brain, ScanSearch, Globe2,
  Kanban, ShieldAlert, Send, ScrollText, Settings,
  LogOut, ChevronLeft, ChevronRight, TrendingUp, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';

// ─── Nav sections matching the original screenshot ──────────────────────────

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    exact: true  },
      { to: '/intelligence', icon: Sparkles,        label: 'Intelligence', exact: false },
      { to: '/analytics',    icon: BarChart3,       label: 'Analytics',    exact: false },
    ],
  },
  {
    label: 'AI CORE',
    items: [
      { to: '/agents',        icon: Bot,       label: 'Agents',         exact: false },
      { to: '/agent-manager', icon: Users2,    label: 'Agent Manager',  exact: false },
      { to: '/orchestrator',  icon: Workflow,  label: 'Orchestrator',   exact: false },
      { to: '/skills',        icon: Brain,     label: 'Skills',         exact: false },
      { to: '/analyzer',      icon: ScanSearch,label: 'Analyzer',       exact: false },
      { to: '/site-builder',  icon: Globe2,    label: 'Site Builder',   exact: false },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { to: '/projects',    icon: Kanban,      label: 'Pipeline',    exact: false },
      { to: '/skills-usage',icon: TrendingUp,  label: 'Skills Usage',exact: false },
      { to: '/security',    icon: ShieldAlert, label: 'Security',    exact: false },
      { to: '/telegram',    icon: Send,        label: 'Telegram',    exact: false },
      { to: '/activity',    icon: ScrollText,  label: 'Activity Log',exact: false },
      { to: '/settings',    icon: Settings,    label: 'Settings',    exact: false },
    ],
  },
] as const;

const ROLE_LABEL: Record<string, string> = {
  admin: 'FOUNDER ACCESS',
  user:  'MEMBER',
};

// ─── Sidebar component ───────────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location  = useLocation();
  const { data: role } = useUserRole();
  const { user, signOut } = useAuth();
  const isAdmin = role === 'admin';

  const initial = user?.email?.slice(0, 1).toUpperCase() ?? 'D';
  const username = user?.email?.split('@')[0] ?? 'dev';
  const roleLabel = ROLE_LABEL[role ?? 'user'] ?? 'MEMBER';

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-full bg-card border-r border-border overflow-hidden flex-shrink-0"
    >
      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border flex-shrink-0">
        {/* Orange triangle "A" logo */}
        <div
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(234,88,12,0.9) 0%, rgba(192,74,8,0.95) 100%)',
            boxShadow: '0 0 12px rgba(234,88,12,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <span className="text-white font-black text-base select-none">A</span>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap min-w-0"
            >
              <p className="text-[11px] font-bold tracking-[0.18em] text-foreground uppercase leading-none">
                ARDENO STUDIO
              </p>
              <p className="text-[8px] tracking-[0.25em] text-muted-foreground uppercase mt-1">
                INTERNAL AGENCY OS
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Description (expanded only) ───────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-b border-border/40 flex-shrink-0"
          >
            <p className="text-[10px] text-muted-foreground leading-[1.6]">
              Premium operating layer<br />for Ardeno Studio.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            {/* Section label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.35em] uppercase px-4 pt-3 pb-1.5"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map(({ to, icon: Icon, label, exact }) => {
              const active = exact
                ? location.pathname === to
                : location.pathname === to || location.pathname.startsWith(to + '/');

              return (
                <NavLink
                  key={`${to}-${label}`}
                  to={to}
                  className={cn(
                    'relative flex items-center gap-3 py-2 text-[13px] font-medium transition-all duration-150 group',
                    collapsed ? 'justify-center px-0' : 'px-4',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={active ? { background: 'rgba(234,88,12,0.08)' } : undefined}
                  title={collapsed ? label : undefined}
                >
                  {/* Active left bar */}
                  {active && (
                    <span
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
                      style={{ background: '#EA580C' }}
                    />
                  )}

                  <Icon
                    size={15}
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active dot */}
                  {active && !collapsed && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#EA580C' }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <div className="mb-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.35em] uppercase px-4 pt-3 pb-1.5 flex items-center gap-1.5"
                >
                  <Crown size={8} className="text-primary" /> ADMIN
                </motion.p>
              )}
            </AnimatePresence>

            <NavLink
              to="/admin/roles"
              className={cn(
                'relative flex items-center gap-3 py-2 text-[13px] font-medium transition-all duration-150 group',
                collapsed ? 'justify-center px-0' : 'px-4',
                location.pathname === '/admin/roles'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={location.pathname === '/admin/roles' ? { background: 'rgba(234,88,12,0.08)' } : undefined}
              title={collapsed ? 'Role Manager' : undefined}
            >
              {location.pathname === '/admin/roles' && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
                  style={{ background: '#EA580C' }}
                />
              )}
              <Crown
                size={15}
                className={cn(
                  'flex-shrink-0',
                  location.pathname === '/admin/roles' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 whitespace-nowrap overflow-hidden"
                  >
                    Role Manager
                  </motion.span>
                )}
              </AnimatePresence>
              {location.pathname === '/admin/roles' && !collapsed && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EA580C' }} />
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── User section ──────────────────────────────────── */}
      <div className="border-t border-border px-3 py-3 flex-shrink-0 space-y-2">
        {/* Online indicator */}
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="relative flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-2" />
            <div className="absolute inset-0 rounded-full bg-chart-2 animate-ping opacity-40" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] font-mono text-chart-2 tracking-wider truncate"
              >
                3 AGENTS ONLINE
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* User info row */}
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-foreground"
            style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.25)' }}
          >
            {initial}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[11px] font-semibold text-foreground truncate">{username}</p>
                <p
                  className="text-[8px] font-mono tracking-wider uppercase truncate"
                  style={{ color: '#EA580C' }}
                >
                  {roleLabel}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign out */}
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={signOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[11px] px-1 py-0.5 transition-colors w-full"
            >
              <LogOut size={11} />
              <span>Sign Out</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full z-10',
          'bg-card border border-border text-muted-foreground',
          'hover:text-primary hover:border-primary/40 transition-all duration-200',
          'flex items-center justify-center'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
