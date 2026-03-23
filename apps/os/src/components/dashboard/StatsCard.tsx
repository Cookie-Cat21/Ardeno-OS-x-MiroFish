import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label:     string;
  value:     string | number;
  icon:      LucideIcon;
  trend?:    { value: number; label: string };
  accent?:   'gold' | 'teal' | 'green' | 'red';
  className?: string;
}

const ACCENT_STYLES = {
  gold:  { icon: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20' },
  teal:  { icon: 'text-chart-2',    bg: 'bg-chart-2/10',    border: 'border-chart-2/20' },
  green: { icon: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20' },
  red:   { icon: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'  },
};

export function StatsCard({ label, value, icon: Icon, trend, accent = 'gold', className }: StatsCardProps) {
  const s = ACCENT_STYLES[accent];

  return (
    <div className={cn('glass rounded-xl p-5 flex flex-col gap-3 gold-border glass-hover', className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">{label}</span>
        <div className={cn('rounded-lg p-2', s.bg, `border ${s.border}`)}>
          <Icon className={cn('h-4 w-4', s.icon)} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-foreground text-2xl font-bold font-display">{value}</span>
        {trend && (
          <span className={cn('text-xs font-medium', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% <span className="text-muted-foreground">{trend.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
