import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/MotionPrimitives";
import { Cpu, Zap, Clock, DollarSign } from "lucide-react";

interface AgentStat {
  agent_name: string;
  total_calls: number;
  avg_response_ms: number;
  total_tokens: number;
  total_cost: number;
}

export default function AgentPerformance() {
  const [stats, setStats] = useState<AgentStat[]>([]);
  const [totals, setTotals] = useState({ calls: 0, tokens: 0, cost: 0, avgMs: 0 });

  useEffect(() => {
    supabase
      .from("agent_usage")
      .select("agent_name, total_tokens, estimated_cost, response_time_ms")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (!data || data.length === 0) return;

        const map: Record<string, { calls: number; tokens: number; cost: number; totalMs: number }> = {};
        let allCalls = 0, allTokens = 0, allCost = 0, allMs = 0;

        data.forEach((row) => {
          const name = row.agent_name;
          if (!map[name]) map[name] = { calls: 0, tokens: 0, cost: 0, totalMs: 0 };
          map[name].calls++;
          map[name].tokens += Number(row.total_tokens) || 0;
          map[name].cost += Number(row.estimated_cost) || 0;
          map[name].totalMs += Number(row.response_time_ms) || 0;
          allCalls++;
          allTokens += Number(row.total_tokens) || 0;
          allCost += Number(row.estimated_cost) || 0;
          allMs += Number(row.response_time_ms) || 0;
        });

        const agentStats = Object.entries(map)
          .map(([agent_name, s]) => ({
            agent_name,
            total_calls: s.calls,
            avg_response_ms: Math.round(s.totalMs / s.calls),
            total_tokens: s.tokens,
            total_cost: s.cost,
          }))
          .sort((a, b) => b.total_calls - a.total_calls)
          .slice(0, 6);

        setStats(agentStats);
        setTotals({
          calls: allCalls,
          tokens: allTokens,
          cost: allCost,
          avgMs: allCalls > 0 ? Math.round(allMs / allCalls) : 0,
        });
      });
  }, []);

  const summaryCards = [
    { label: "Total Calls", value: totals.calls, icon: Zap, color: "hsl(258 90% 66%)" },
    { label: "Avg Response", value: totals.avgMs, suffix: "ms", icon: Clock, color: "hsl(217 91% 60%)" },
    { label: "Tokens Used", value: totals.tokens, icon: Cpu, color: "hsl(12 100% 50%)" },
    { label: "Est. Cost", value: totals.cost, prefix: "$", decimals: true, icon: DollarSign, color: "hsl(142 70% 62%)" },
  ];

  if (stats.length === 0) {
    return (
      <motion.div whileHover={{ scale: 1.01 }} className="glass-card p-6">
        <p className="text-sm text-muted-foreground font-body text-center py-4">No agent usage data yet. Start chatting with agents to see performance metrics.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500" style={{
              backgroundImage: `radial-gradient(circle at 70% 30%, ${card.color.replace(")", " / 0.4)")}, transparent 60%)`
            }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body font-medium">{card.label}</p>
              </div>
              <p className="font-display text-xl font-semibold text-foreground">
                {card.prefix}{card.decimals ? card.value.toFixed(4) : <AnimatedNumber value={card.value} />}{card.suffix}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent breakdown */}
      <motion.div whileHover={{ scale: 1.005 }} className="glass-card p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-body font-medium mb-4">Top Agents by Usage</p>
        <div className="space-y-3">
          {stats.map((agent, i) => {
            const maxCalls = stats[0]?.total_calls || 1;
            return (
              <motion.div
                key={agent.agent_name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-[12px] text-foreground/80 font-body w-32 truncate">{agent.agent_name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(agent.total_calls / maxCalls) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <span className="text-[11px] font-data text-muted-foreground w-16 text-right">{agent.total_calls} calls</span>
                <span className="text-[11px] font-data text-muted-foreground w-16 text-right hidden md:block">{agent.avg_response_ms}ms</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
