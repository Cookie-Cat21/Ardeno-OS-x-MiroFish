import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { format, isToday, isPast, subDays } from "date-fns";

interface BriefingData {
  summary: string;
  highlights: string[];
  warnings: string[];
  generated_at: string;
}

export default function DailyBriefing() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [liveStats, setLiveStats] = useState({
    overdueTasks: 0,
    todayTasks: 0,
    newLeads7d: 0,
    openDeals: 0,
    overdueInvoices: 0,
  });

  useEffect(() => {
    supabase
      .from("daily_briefings")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const content = data[0].content as any;
          if (content?.summary) {
            setBriefing({
              summary: content.summary,
              highlights: content.highlights || [],
              warnings: content.warnings || [],
              generated_at: data[0].generated_at || "",
            });
          }
        }
      });

    Promise.all([
      supabase.from("tasks").select("id, due_date, status").neq("status", "Done"),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", subDays(new Date(), 7).toISOString()),
      supabase.from("pipeline_deals").select("id", { count: "exact", head: true }).not("stage", "in", '("Closed Won","Closed Dead")'),
      supabase.from("invoices").select("id, due_date, status").neq("status", "Paid"),
    ]).then(([tasksRes, leadsRes, dealsRes, invoicesRes]) => {
      const tasks = tasksRes.data ?? [];
      const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length;
      const todayTasks = tasks.filter(t => t.due_date && isToday(new Date(t.due_date))).length;
      const overdueInvoices = (invoicesRes.data ?? []).filter(i => i.due_date && isPast(new Date(i.due_date))).length;

      setLiveStats({
        overdueTasks,
        todayTasks,
        newLeads7d: leadsRes.count || 0,
        openDeals: dealsRes.count || 0,
        overdueInvoices,
      });
    });
  }, []);

  const generateBriefing = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("intelligence", {
        body: { type: "daily-briefing" },
      });
      if (error) throw error;
      if (data?.briefing) {
        setBriefing(data.briefing);
        toast.success("Briefing generated");
      }
    } catch {
      toast.error("Could not generate briefing");
    } finally {
      setGenerating(false);
    }
  };

  const statItems = [
    { icon: Clock, label: "Due Today", value: liveStats.todayTasks, alert: false },
    { icon: AlertTriangle, label: "Overdue", value: liveStats.overdueTasks, alert: liveStats.overdueTasks > 0 },
    { icon: TrendingUp, label: "New Leads (7d)", value: liveStats.newLeads7d, alert: false },
    { icon: CheckCircle2, label: "Open Deals", value: liveStats.openDeals, alert: false },
  ];

  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-medium text-muted-foreground font-body">AI Daily Briefing</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateBriefing}
          disabled={generating}
          className="text-[10px] h-7 px-2 text-muted-foreground/50 hover:text-foreground"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${generating ? "animate-spin" : ""}`} />
          {generating ? "..." : "Generate"}
        </Button>
      </div>

      {/* Quick stat row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {statItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40">
            <item.icon className={`h-3 w-3 shrink-0 ${item.alert ? "text-destructive" : "text-muted-foreground/50"}`} />
            <div>
              <p className="font-display text-sm font-semibold text-foreground">{item.value}</p>
              <p className="text-[9px] text-muted-foreground/50 font-body">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {(liveStats.overdueTasks > 0 || liveStats.overdueInvoices > 0) && (
        <div className="mb-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[11px] text-foreground/70 font-body space-y-0.5">
              {liveStats.overdueTasks > 0 && <p><span className="text-destructive font-medium">{liveStats.overdueTasks} overdue task{liveStats.overdueTasks > 1 ? "s" : ""}</span></p>}
              {liveStats.overdueInvoices > 0 && <p><span className="text-destructive font-medium">{liveStats.overdueInvoices} overdue invoice{liveStats.overdueInvoices > 1 ? "s" : ""}</span></p>}
            </div>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {briefing ? (
        <div className="p-3 rounded-lg border border-primary/10 bg-primary/[0.02]">
          <div className="text-[12px] text-foreground/70 font-body prose prose-sm prose-invert max-w-none [&_p]:text-foreground/70 [&_p]:text-[12px]">
            <ReactMarkdown>{briefing.summary}</ReactMarkdown>
          </div>
          {briefing.generated_at && (
            <span className="text-[9px] text-muted-foreground/30 font-data mt-2 block">
              Generated {format(new Date(briefing.generated_at), "MMM d, h:mm a")}
            </span>
          )}
        </div>
      ) : (
        <div className="text-center py-3">
          <p className="text-[11px] text-muted-foreground/40 font-body">Click Generate for AI insights</p>
        </div>
      )}
    </div>
  );
}
