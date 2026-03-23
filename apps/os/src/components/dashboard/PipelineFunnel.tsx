import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const FUNNEL_STAGES = [
  { key: "New Lead", label: "Leads", color: "hsl(var(--chart-4))" },
  { key: "Contacted", label: "Qualified", color: "hsl(var(--chart-3))" },
  { key: "Proposal Sent", label: "Proposal", color: "hsl(var(--chart-5))" },
  { key: "Negotiating", label: "Negotiating", color: "hsl(var(--chart-1))" },
  { key: "Closed Won", label: "Closed", color: "hsl(var(--chart-2))" },
];

export default function PipelineFunnel() {
  const [stages, setStages] = useState<Record<string, number>>({});
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    supabase
      .from("pipeline_deals")
      .select("stage, value")
      .then(({ data: deals }) => {
        if (!deals) return;
        const map: Record<string, number> = {};
        let tv = 0;
        deals.forEach((d) => {
          const s = d.stage || "Unknown";
          map[s] = (map[s] || 0) + 1;
          tv += Number(d.value) || 0;
        });
        setStages(map);
        setTotalValue(tv);
      });
  }, []);

  const maxCount = Math.max(...FUNNEL_STAGES.map((s) => stages[s.key] || 0), 1);

  return (
    <div className="dash-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground font-body">Pipeline Funnel</p>
          <p className="text-xl font-display font-semibold text-foreground mt-0.5">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground/50 font-data">
          {Object.values(stages).reduce((a, b) => a + b, 0)} deals
        </span>
      </div>

      <div className="space-y-3">
        {FUNNEL_STAGES.map((stage, i) => {
          const count = stages[stage.key] || 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={stage.key} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground font-body">{stage.label}</span>
                <span className="text-[11px] font-data text-foreground font-medium">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-full transition-all group-hover:brightness-110"
                  style={{ background: stage.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
