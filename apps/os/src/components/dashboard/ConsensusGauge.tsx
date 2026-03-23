import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

export function ConsensusGauge() {
  const { data: projects = [] } = useProjects();

  const avg = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.consensus_score, 0) / projects.length)
    : 0;

  // SVG arc parameters
  const radius    = 52;
  const stroke    = 8;
  const circum    = 2 * Math.PI * radius;
  const arcLen    = circum * 0.75; // 270° arc
  const offset    = circum * 0.125; // start at 225°
  const fillLen   = arcLen * (avg / 100);

  const color = avg >= 75 ? '#D4AF37' : avg >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="ardeno-panel rounded-xl p-5 flex flex-col items-center gap-2 gold-border glass-hover">
      <span className="text-muted-foreground text-xs uppercase tracking-widest self-start">Avg Consensus</span>

      <div className="relative flex items-center justify-center my-2">
        <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-[135deg]">
          {/* Track */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke="rgba(30,37,56,0.8)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${circum}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${fillLen} ${circum}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-foreground text-3xl font-bold font-display">{avg}%</span>
          <span className="text-muted-foreground text-[10px] mt-0.5">consensus</span>
        </div>
      </div>

      <p className={cn('text-xs font-medium', avg >= 75 ? 'text-primary' : avg >= 50 ? 'text-yellow-400' : 'text-red-400')}>
        {avg >= 75 ? 'Healthy pipeline' : avg >= 50 ? 'Needs attention' : 'Critical — review required'}
      </p>
    </div>
  );
}
