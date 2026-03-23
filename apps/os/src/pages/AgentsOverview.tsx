import { Bot, TrendingUp, Award, Activity } from 'lucide-react';
import { useAgentStats } from '@/hooks/useAgentReviews';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_DOT = (lastReview: string | undefined) => {
  if (!lastReview) return 'bg-muted';
  const diffMin = (Date.now() - new Date(lastReview).getTime()) / 60_000;
  return diffMin < 5 ? 'bg-chart-2' : diffMin < 60 ? 'bg-yellow-400' : 'bg-muted';
};

export default function AgentsOverviewPage() {
  const { data: agents = [], isLoading } = useAgentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map(agent => {
          const lastReview = agent.recentScores[agent.recentScores.length - 1]?.date;
          const dotColor   = STATUS_DOT(lastReview);

          return (
            <div
              key={agent.name}
              className="ardeno-panel rounded-xl p-5 border border-border gold-border glass-hover space-y-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-lg border"
                  style={{ background: `${agent.color}20`, borderColor: `${agent.color}30` }}
                >
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground text-sm font-semibold truncate">{agent.name}</p>
                    <div className={cn('h-2 w-2 rounded-full shrink-0', dotColor, dotColor === 'bg-chart-2' && 'animate-pulse')} />
                  </div>
                  <p className="text-muted-foreground text-[11px]">{agent.role}</p>
                </div>
                <span className="text-muted-foreground text-xs">×{agent.weight}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-primary font-bold font-display text-lg">{agent.avgScore}%</p>
                  <p className="text-muted-foreground text-[10px]">Avg Score</p>
                </div>
                <div>
                  <p className="text-foreground font-semibold text-lg">{agent.totalReviews}</p>
                  <p className="text-muted-foreground text-[10px]">Reviews</p>
                </div>
                <div>
                  <p className={cn('font-semibold text-lg', agent.successRate >= 70 ? 'text-green-400' : 'text-yellow-400')}>
                    {agent.successRate}%
                  </p>
                  <p className="text-muted-foreground text-[10px]">Pass Rate</p>
                </div>
              </div>

              {/* Sparkline */}
              {agent.recentScores.length > 0 ? (
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agent.recentScores} barSize={8} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                        {agent.recentScores.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.score >= 70 ? agent.color : entry.score >= 50 ? '#F59E0B' : '#EF4444'}
                          />
                        ))}
                      </Bar>
                      <Tooltip
                        content={({ payload }) =>
                          payload?.[0] ? (
                            <div className="ardeno-panel rounded px-2 py-1 text-xs text-foreground border border-border">
                              {Math.round(payload[0].value as number)}%
                            </div>
                          ) : null
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center">
                  <p className="text-muted-foreground text-xs">No reviews yet</p>
                </div>
              )}

              {/* Status pill */}
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs border',
                dotColor === 'bg-chart-2'
                  ? 'bg-chart-2/10 border-chart-2/20 text-chart-2'
                  : dotColor === 'bg-yellow-400'
                  ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400'
                  : 'bg-card-3 border-border text-muted-foreground'
              )}>
                <Activity className="h-3 w-3" />
                {dotColor === 'bg-chart-2'
                  ? 'Active — reviewed <5 min ago'
                  : dotColor === 'bg-yellow-400'
                  ? 'Idle — last review <1h ago'
                  : agent.totalReviews === 0 ? 'No reviews yet' : 'Standby'
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance summary */}
      {agents.length > 0 && (
        <div className="ardeno-panel rounded-xl p-5 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Team Performance Summary</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-foreground text-2xl font-bold font-display">
                {agents.reduce((s, a) => s + a.totalReviews, 0)}
              </p>
              <p className="text-muted-foreground text-xs">Total Reviews</p>
            </div>
            <div>
              <p className="text-primary text-2xl font-bold font-display">
                {agents.length ? Math.round(agents.reduce((s, a) => s + a.avgScore, 0) / agents.length) : 0}%
              </p>
              <p className="text-muted-foreground text-xs">Team Avg Score</p>
            </div>
            <div>
              <p className="text-green-400 text-2xl font-bold font-display">
                {agents.length ? Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length) : 0}%
              </p>
              <p className="text-muted-foreground text-xs">Pass Rate</p>
            </div>
            <div>
              <p className="text-chart-2 text-2xl font-bold font-display">{agents.length}</p>
              <p className="text-muted-foreground text-xs">Agents Active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
