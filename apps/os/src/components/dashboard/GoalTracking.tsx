import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/MotionPrimitives";

interface Goal {
  label: string;
  current: number;
  target: number;
  prefix?: string;
  colorVar: string;
}

export default function GoalTracking() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("pipeline_deals").select("value, stage"),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("proposals").select("id, status"),
      supabase.from("invoices").select("amount, status"),
    ]).then(([dealsRes, leadsRes, propsRes, invoicesRes]) => {
      const closedRevenue = (dealsRes.data ?? [])
        .filter(d => d.stage === "Closed Won")
        .reduce((s, d) => s + (Number(d.value) || 0), 0);

      const paidRevenue = (invoicesRes.data ?? [])
        .filter(i => i.status === "Paid")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const acceptedProposals = (propsRes.data ?? [])
        .filter(p => p.status === "Accepted" || p.status === "Sent").length;

      setGoals([
        { label: "Revenue", current: paidRevenue || closedRevenue, target: 50000, prefix: "$", colorVar: "--chart-2" },
        { label: "Leads", current: leadsRes.count || 0, target: 100, colorVar: "--chart-4" },
        { label: "Proposals", current: acceptedProposals, target: 20, colorVar: "--chart-3" },
        { label: "Invoices Paid", current: (invoicesRes.data ?? []).filter(i => i.status === "Paid").length, target: 15, colorVar: "--chart-5" },
      ]);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {goals.map((goal, i) => {
        const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;

        return (
          <motion.div
            key={goal.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="dash-card p-5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted-foreground/60 font-body font-medium">{goal.label}</p>
              <span className="text-[10px] font-data text-muted-foreground/40">{Math.round(pct)}%</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="font-display text-xl font-semibold text-foreground">
                {goal.prefix}<AnimatedNumber value={goal.current} />
              </span>
              <span className="text-[10px] text-muted-foreground/40 font-data">
                / {goal.prefix}{goal.target.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full rounded-full"
                style={{ background: `hsl(var(${goal.colorVar}))` }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
