import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  "New Lead": "hsl(217, 91%, 60%)",
  "Contacted": "hsl(258, 90%, 66%)",
  "Proposal Sent": "hsl(25, 95%, 62%)",
  "Negotiating": "hsl(12, 100%, 50%)",
  "Closed Won": "hsl(142, 70%, 62%)",
  "Closed Lost": "hsl(0, 72%, 55%)",
};

interface StageCount {
  stage: string;
  count: number;
}

export default function PipelineSummary() {
  const [stages, setStages] = useState<StageCount[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);

  useEffect(() => {
    supabase
      .from("pipeline_deals")
      .select("stage")
      .then(({ data: deals }) => {
        if (!deals) return;
        const map: Record<string, number> = {};
        deals.forEach((d) => {
          const s = d.stage || "Unknown";
          map[s] = (map[s] || 0) + 1;
        });
        const arr = Object.entries(map).map(([stage, count]) => ({ stage, count }));
        setStages(arr);
        setTotalDeals(deals.length);
      });
  }, []);

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-body font-medium">
            Pipeline
          </p>
          <p className="text-2xl font-display font-semibold text-foreground mt-1">{totalDeals} deals</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(258 90% 66% / 0.08)' }}>
          <GitBranch className="h-[18px] w-[18px] text-[hsl(258,90%,66%)]" />
        </div>
      </div>
      <div className="space-y-2.5">
        {stages.map((s) => (
          <div key={s.stage} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground font-body w-24 truncate">{s.stage}</span>
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(s.count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full rounded-full"
                style={{ background: STAGE_COLORS[s.stage] || "hsl(260, 15%, 40%)" }}
              />
            </div>
            <span className="text-[12px] font-data text-foreground w-6 text-right">{s.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
