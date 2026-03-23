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
      label: "Revenue",
      value: data.revenue,
      prefix: "$",
      trend: "+12%",
      trendUp: true,
      context: "Pipeline total",
      icon: DollarSign,
      accentVar: "--chart-2",
    },
    {
      label: "Active Agents",
      value: data.activeAgents,
      trend: "All systems go",
      trendUp: true,
      context: "AI workforce",
      icon: Bot,
      accentVar: "--chart-3",
    },
    {
      label: "Leads",
      value: data.leads,
      trend: data.leads > 0 ? `+${Math.min(data.leads, 7)} this week` : "Start prospecting",
      trendUp: data.leads > 0,
      context: data.leads > 10 ? "Top source: Website" : "Grow your pipeline",
      icon: Users,
      accentVar: "--chart-4",
    },
    {
      label: "Open Projects",
      value: data.projects,
      trend: data.projects > 0 ? `${data.projects} active` : "No projects yet",
      trendUp: data.projects > 0,
      context: "In progress",
      icon: FolderKanban,
      accentVar: "--chart-1",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="kpi-card p-5 group"
          style={{
            // @ts-ignore
            "--kpi-accent": `hsl(var(${kpi.accentVar}))`,
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[var(--radius)]"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, hsl(var(${kpi.accentVar}) / 0.06), transparent 60%)`,
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: `hsl(var(${kpi.accentVar}) / 0.1)` }}>
                <kpi.icon className="h-4 w-4" style={{ color: `hsl(var(${kpi.accentVar}))` }} />
              </div>
              <div className="flex items-center gap-1">
                {kpi.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={`text-[10px] font-data ${kpi.trendUp ? "text-success" : "text-muted-foreground"}`}>
                  {kpi.trend}
                </span>
              </div>
            </div>

            <div className="font-display text-3xl lg:text-4xl text-foreground font-semibold tracking-tight">
              {kpi.prefix}<AnimatedNumber value={kpi.value} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-body">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground/40 font-data mt-0.5">{kpi.context}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
