import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { useSkillsUsage, useSkillsAnalytics } from '@/hooks/useSkillsUsage';
import { Brain, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Frontend:'#60A5FA', Backend:'#4ADE80', Security:'#F87171',
  Localization:'#FACC15', DevOps:'#C084FC', Design:'#F472B6', General:'#8892A4',
};

const TooltipStyle = {
  contentStyle: { background: '#0F1320', border: '1px solid #1E2538', borderRadius: 8, fontSize: 12, color: '#F8F9FA' },
};

export default function SkillsUsagePage() {
  const { data: stats = [], isLoading } = useSkillsUsage();
  const { data: analytics }             = useSkillsAnalytics();

  const top10 = stats.slice(0, 10);
  const pieData = analytics
    ? Object.entries(analytics.byCategory).map(([cat, count]) => ({ name: cat, value: count }))
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top skills by usage */}
        <div className="ardeno-panel rounded-xl p-5 border border-border space-y-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Top 10 Skills by Usage</p>
          {top10.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top10} layout="vertical" barSize={10} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" />
                <XAxis type="number" stroke="#8892A4" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#8892A4" tick={{ fontSize: 9 }} width={90} />
                <Tooltip {...TooltipStyle} formatter={(v: number) => [v, 'Uses']} />
                <Bar dataKey="usage_count" fill="#D4AF37" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
              No usage data yet — run agent reviews to track skills.
            </div>
          )}
        </div>

        {/* Skills by category */}
        <div className="ardeno-panel rounded-xl p-5 border border-border space-y-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Skills by Category</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#8892A4'} />
                  ))}
                </Pie>
                <Tooltip {...TooltipStyle} formatter={(v: number) => [v, 'Skills']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
              No skills yet.
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ardeno-panel rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <p className="text-foreground text-sm font-semibold">All Skills</p>
        </div>

        <div className="divide-y divide-border/40">
          {stats.map(skill => (
            <div key={skill.id} className="flex items-center gap-4 px-5 py-3 hover:bg-card-3/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-sm font-medium truncate">{skill.name}</p>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: `${CATEGORY_COLORS[skill.category] ?? '#8892A4'}20`,
                      color:       CATEGORY_COLORS[skill.category] ?? '#8892A4',
                    }}
                  >
                    {skill.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 text-right">
                <div>
                  <p className="text-primary font-semibold text-sm">{skill.success_rate}%</p>
                  <p className="text-muted-foreground text-[10px]">success</p>
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">{skill.usage_count}</p>
                  <p className="text-muted-foreground text-[10px]">uses</p>
                </div>
                <div>
                  <p className="text-chart-2 font-semibold text-sm">+{skill.total_bonus_pts}</p>
                  <p className="text-muted-foreground text-[10px]">bonus pts</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] font-mono">{skill.version}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
