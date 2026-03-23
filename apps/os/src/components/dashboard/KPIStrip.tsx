import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/MotionPrimitives";
import { TrendingUp, TrendingDown, DollarSign, Bot, Users, FolderKanban } from "lucide-react";

interface KPIData {
  revenue: number;
  activeAgents: number;
  leads: number;
  projects: number;
}

export default function KPIStrip({ data }: { data: KPIData }) {
  const kpis = [
    {
      label: "Revenue Signal",
      value: data.revenue,
      prefix: "$",
      trend: "+12%",
      trendUp: true,
      context: "Pipeline value",
      icon: DollarSign,
      color: "blue",
    },
    {
      label: "Active Agents",
      value: data.activeAgents,
      trend: "Optimal",
      trendUp: true,
      context: "Society load",
      icon: Bot,
      color: "indigo",
    },
    {
      label: "Lead Flow",
      value: data.leads,
      trend: `+${Math.min(data.leads, 7)}`,
      trendUp: data.leads > 0,
      context: "Qualified leads",
      icon: Users,
      color: "violet",
    },
    {
      label: "Open Delivery",
      value: data.projects,
      trend: "Active",
      trendUp: data.projects > 0,
      context: "Live projects",
      icon: FolderKanban,
      color: "sky",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-500",
    indigo: "bg-indigo-50 text-indigo-500",
    violet: "bg-violet-50 text-violet-500",
    sky: "bg-sky-50 text-sky-500",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.5 }}
          className="arden-card group !p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-sm border border-white ${colorMap[kpi.color]}`}>
              <kpi.icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50/50 border border-slate-100/50">
              {kpi.trendUp ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-slate-400" />
              )}
              <span className={`text-[10px] font-bold ${kpi.trendUp ? "text-green-600" : "text-slate-400"}`}>
                {kpi.trend}
              </span>
            </div>
          </div>

          <div className="font-display text-4xl text-slate-900 font-bold tracking-tight">
            {kpi.prefix}<AnimatedNumber value={kpi.value} />
          </div>
          <div className="mt-2 flex flex-col">
             <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{kpi.context}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
