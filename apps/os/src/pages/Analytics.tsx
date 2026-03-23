import { useAgentUsageSummary, useAgentUsage } from "@/hooks/useAgentUsage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { Cpu, Zap, DollarSign, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;
const CHART_COLORS = ["hsl(250, 90%, 65%)", "hsl(152, 70%, 50%)", "hsl(38, 90%, 55%)", "hsl(200, 80%, 60%)", "hsl(300, 70%, 55%)", "hsl(340, 80%, 55%)", "hsl(180, 60%, 50%)", "hsl(60, 80%, 55%)", "hsl(280, 70%, 60%)", "hsl(20, 85%, 55%)"];

export default function Analytics() {
  const { data: usageSummaries, rows: usageRows } = useAgentUsageSummary();

  // Real DB queries
  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ["analytics-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, status, value");
      return data ?? [];
    },
  });
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["analytics-deals"],
    queryFn: async () => {
      const { data } = await supabase.from("pipeline_deals").select("id, stage, value");
      return data ?? [];
    },
  });
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["analytics-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, created_at");
      return data ?? [];
    },
  });

  const isBusinessLoading = projLoading || dealsLoading || leadsLoading;

  const totalPipelineValue = deals.filter(d => d.stage !== "Closed Dead").reduce((s, d) => s + Number(d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === "Closed Won").reduce((s, d) => s + Number(d.value || 0), 0);
  const avgProjectValue = projects.length > 0 ? projects.reduce((s, p) => s + Number(p.value || 0), 0) / projects.length : 0;
  const newLeadsThisWeek = leads.filter(l => new Date(l.created_at!) > new Date(Date.now() - 7 * 86400000)).length;
  const wonCount = deals.filter(d => d.stage === "Closed Won").length;
  const closedCount = deals.filter(d => d.stage === "Closed Won" || d.stage === "Closed Dead").length;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
  const activeProjects = projects.filter(p => p.status !== "Delivered").length;

  const projectsByStatus = ["Discovery", "Design", "Development", "Review", "Delivered"].map(status => ({
    name: status,
    value: projects.filter(p => p.status === status).length,
  }));

  // Gemini usage
  const geminiSummaries = usageSummaries.filter(s => s.provider === "gemini");
  const geminiTotalTokens = geminiSummaries.reduce((s, a) => s + a.total_tokens, 0);
  const geminiTotalRequests = geminiSummaries.reduce((s, a) => s + a.total_requests, 0);
  const geminiTotalCost = geminiSummaries.reduce((s, a) => s + a.total_cost, 0);
  const geminiAvgResponse = geminiSummaries.length > 0
    ? Math.round(geminiSummaries.reduce((s, a) => s + a.avg_response_time, 0) / geminiSummaries.length) : 0;

  const geminiTokenChart = geminiSummaries.map(s => ({
    name: s.agent_name.split(" ").slice(0, 2).join(" "),
    input: s.total_input_tokens, output: s.total_output_tokens,
  }));

  const geminiRows = (usageRows ?? []).filter(r => r.provider === "gemini");
  const dayMap = new Map<string, { tokens: number; requests: number; cost: number }>();
  for (const r of geminiRows) {
    const day = format(new Date(r.created_at), "MMM dd");
    const existing = dayMap.get(day) || { tokens: 0, requests: 0, cost: 0 };
    existing.tokens += r.total_tokens || 0;
    existing.requests += 1;
    existing.cost += Number(r.estimated_cost) || 0;
    dayMap.set(day, existing);
  }
  const usageOverTime = Array.from(dayMap.entries()).map(([day, v]) => ({ day, ...v }));

  const stats = [
    { label: "Pipeline Total", value: `$${totalPipelineValue.toLocaleString()}` },
    { label: "Won Revenue", value: `$${wonValue.toLocaleString()}` },
    { label: "Avg Project Value", value: `$${Math.round(avgProjectValue).toLocaleString()}` },
    { label: "New Leads (7d)", value: newLeadsThisWeek.toString() },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Active Projects", value: activeProjects.toString() },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-[1440px] space-y-8">
      <motion.div variants={fadeUp}>
        <div className="section-label">Analytics</div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            {isBusinessLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="font-display text-2xl text-foreground">{stat.value}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* GEMINI AGENT CREDIT USAGE */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          Gemini Agent Credit Usage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Zap, value: geminiTotalTokens.toLocaleString(), label: "Total Tokens" },
            { icon: Activity, value: geminiTotalRequests.toString(), label: "Total Requests" },
            { icon: DollarSign, value: `$${geminiTotalCost.toFixed(4)}`, label: "Est. Cost" },
            { icon: Clock, value: `${geminiAvgResponse}ms`, label: "Avg Response" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="glass-card rounded-xl p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-display text-xl text-foreground">{value}</div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Tokens by Agent</h3>
            {geminiTokenChart.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No usage data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={geminiTokenChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="input" name="Input Tokens" fill="hsl(250, 90%, 65%)" radius={[4, 4, 0, 0]} stackId="tokens" />
                  <Bar dataKey="output" name="Output Tokens" fill="hsl(152, 70%, 50%)" radius={[4, 4, 0, 0]} stackId="tokens" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Usage Over Time</h3>
            {usageOverTime.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Usage history will appear here</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Line type="monotone" dataKey="tokens" name="Tokens" stroke="hsl(250, 90%, 65%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="requests" name="Requests" stroke="hsl(152, 70%, 50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {geminiSummaries.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden mt-6">
            <div className="px-5 py-3 border-b border-border/30">
              <h3 className="text-sm font-medium text-foreground">Agent Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    {["Agent", "Requests", "Input Tokens", "Output Tokens", "Total Tokens", "Est. Cost", "Avg Response"].map(h => (
                      <th key={h} className={`${h === "Agent" ? "text-left" : "text-right"} px-5 py-2.5 text-xs text-muted-foreground font-medium`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {geminiSummaries.map(s => (
                    <tr key={s.agent_id} className="border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{s.agent_name}</td>
                      <td className="px-5 py-3 text-right font-data text-muted-foreground">{s.total_requests}</td>
                      <td className="px-5 py-3 text-right font-data text-muted-foreground">{s.total_input_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-data text-muted-foreground">{s.total_output_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-data text-foreground">{s.total_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-data text-primary">${s.total_cost.toFixed(4)}</td>
                      <td className="px-5 py-3 text-right font-data text-muted-foreground">{s.avg_response_time}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Projects by Status</h3>
          {isBusinessLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {projectsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">All Agent Requests</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={geminiSummaries.map(s => ({ name: s.agent_name.split(" ").slice(0, 2).join(" "), requests: s.total_requests }))}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Pipeline by stage */}
      <motion.div variants={fadeUp} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Pipeline by Stage</h3>
        {isBusinessLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {["New Lead", "Contacted", "Proposal Sent", "Negotiating", "Closed Won", "Closed Dead"].map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage);
              const total = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
              return (
                <div key={stage} className="text-center p-3 rounded-lg bg-secondary/30">
                  <div className="font-display text-xl text-foreground">{stageDeals.length}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stage}</p>
                  <p className="text-[10px] text-primary font-data">${total.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
