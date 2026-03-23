import { Kanban, Brain, Bot, TrendingUp } from 'lucide-react';
import { HeroBanner }     from '@/components/dashboard/HeroBanner';
import { ConsensusGauge } from '@/components/dashboard/ConsensusGauge';
import { RiskMeter }      from '@/components/dashboard/RiskMeter';
import { ActivityFeed }   from '@/components/dashboard/ActivityFeed';
import { StatsCard }      from '@/components/dashboard/StatsCard';
import { useProjects }    from '@/hooks/useProjects';
import { useSkills }      from '@/hooks/useSkills';
import { QuickStartGuide } from '@/components/QuickStartGuide';

export default function DashboardPage() {
  const { data: projects = [] } = useProjects();
  const { data: skills   = [] } = useSkills();

  const active   = projects.filter(p => p.stage !== 'Done').length;
  const done     = projects.filter(p => p.stage === 'Done').length;
  const highRisk = projects.filter(p => p.risk_score > 70).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <HeroBanner />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Active Projects" value={active}          icon={Kanban}    accent="gold"  />
        <StatsCard label="Completed"        value={done}           icon={TrendingUp} accent="teal"  />
        <StatsCard label="Skills Registered" value={skills.length} icon={Brain}     accent="green" />
        <StatsCard label="High Risk"         value={highRisk}      icon={Bot}       accent="red"   />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ConsensusGauge />
        <RiskMeter />
        <ActivityFeed />
      </div>

      <QuickStartGuide />
    </div>
  );
}
