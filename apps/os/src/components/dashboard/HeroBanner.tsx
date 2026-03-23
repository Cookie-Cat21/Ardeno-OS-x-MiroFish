import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';

export function HeroBanner() {
  const { user }             = useAuth();
  const { data: projects = [] } = useProjects();

  const active = projects.filter(p => p.stage !== 'Done').length;
  const done   = projects.filter(p => p.stage === 'Done').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="ardeno-panel rounded-xl p-6 gold-border relative overflow-hidden">
      {/* Ambient orb */}
      <div className="absolute -top-6 -right-6 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse-orb" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-chart-2/5 blur-3xl pointer-events-none" />

      <div className="relative">
        <p className="text-muted-foreground text-sm mb-1">{greeting},</p>
        <h2 className="text-foreground text-2xl font-bold font-display mb-3">
          {user?.email?.split('@')[0] ?? 'Studio Director'}
        </h2>

        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-foreground font-semibold text-lg">{active}</span>
            <span className="text-muted-foreground ml-1">active projects</span>
          </div>
          <div className="w-px bg-border" />
          <div>
            <span className="text-foreground font-semibold text-lg">{done}</span>
            <span className="text-muted-foreground ml-1">completed</span>
          </div>
          <div className="w-px bg-border" />
          <div>
            <span className="text-chart-2 font-semibold text-lg">3</span>
            <span className="text-muted-foreground ml-1">agents online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
