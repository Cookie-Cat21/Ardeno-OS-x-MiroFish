import { useProjects } from '@/hooks/useProjects';
import { riskLabel } from '@/lib/utils';

export function RiskMeter() {
  const { data: projects = [] } = useProjects();

  const avgRisk = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.risk_score, 0) / projects.length)
    : 0;

  const highRisk = projects.filter(p => p.risk_score > 70).length;
  const { label, color } = riskLabel(avgRisk);

  return (
    <div className="ardeno-panel rounded-xl p-5 flex flex-col gap-3 gold-border glass-hover">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">Risk Meter</span>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>

      {/* Bar */}
      <div className="relative">
        <div className="h-2.5 rounded-full bg-card-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${avgRisk}%`,
              background: avgRisk < 40
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : avgRisk <= 70
                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                : 'linear-gradient(90deg, #EF4444, #F87171)',
            }}
          />
        </div>
        {/* Tick marks */}
        <div className="absolute inset-0 flex">
          {[25, 50, 75].map(pct => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px bg-background/60"
              style={{ left: `${pct}%` }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-foreground font-semibold">{avgRisk}% avg</span>
        <span>100</span>
      </div>

      {highRisk > 0 && (
        <p className="text-xs text-red-400">
          ⚠️ {highRisk} project{highRisk > 1 ? 's' : ''} in high-risk zone
        </p>
      )}
    </div>
  );
}
