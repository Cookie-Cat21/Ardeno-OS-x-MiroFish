import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/MotionPrimitives";
import { TrendingUp } from "lucide-react";

interface DealPoint {
  date: string;
  value: number;
}

export default function RevenueSparkline() {
  const [data, setData] = useState<DealPoint[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase
      .from("pipeline_deals")
      .select("value, created_at")
      .order("created_at", { ascending: true })
      .then(({ data: deals }) => {
        if (!deals) return;
        let cumulative = 0;
        const points = deals.map((d) => {
          cumulative += Number(d.value) || 0;
          return {
            date: d.created_at?.slice(5, 10) || "",
            value: cumulative,
          };
        });
        setData(points);
        setTotal(cumulative);
      });
  }, []);

  if (data.length === 0) {
    return (
      <div className="dash-card p-6 flex flex-col items-center justify-center min-h-[200px]">
        <TrendingUp className="h-8 w-8 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground font-body">No revenue data yet</p>
        <p className="text-[11px] text-muted-foreground/50 font-body mt-1">Close deals to see revenue trends</p>
      </div>
    );
  }

  return (
    <div className="dash-card p-6 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground font-body">Revenue Trend</p>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/8">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-[10px] font-data text-success">Growing</span>
          </div>
        </div>
        <div className="font-display text-3xl md:text-4xl text-foreground font-semibold tracking-tight mt-1">
          $<AnimatedNumber value={total} />
        </div>
        <p className="text-[10px] text-muted-foreground/50 font-data mt-0.5">Cumulative pipeline value</p>

        <div className="h-24 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 60%, 52%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(152, 60%, 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <Tooltip
                contentStyle={{
                  background: "hsl(240 5% 9%)",
                  border: "1px solid hsl(240 4% 14%)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono",
                  color: "hsl(0 0% 95%)",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                labelStyle={{ color: "hsl(240 5% 45%)" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(152, 60%, 52%)"
                strokeWidth={2}
                fill="url(#revGrad2)"
                dot={false}
                activeDot={{ r: 3, fill: "hsl(152, 60%, 52%)", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
