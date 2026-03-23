import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, TrendingUp, Target, Mail, DollarSign, Lightbulb, History } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;

interface IndustryInsight {
  industry: string;
  conversion_rate: number;
  avg_value: number;
  potential: "high" | "medium" | "low";
}

interface Report {
  opportunity_score: number;
  top_industries: IndustryInsight[];
  outreach_insights: {
    best_method: string;
    best_subject_pattern: string;
    reply_rate: number;
    meeting_rate: number;
    recommendation: string;
  };
  pricing_insights: {
    avg_proposal_value: number;
    win_rate: number;
    sweet_spot_min: number;
    sweet_spot_max: number;
    recommendation: string;
  };
  recommendations: {
    priority: "high" | "medium" | "low";
    category: string;
    action: string;
    expected_impact: string;
  }[];
  executive_summary: string;
}

interface DataSummary {
  total_leads: number;
  total_proposals: number;
  total_outreach: number;
  total_projects: number;
  total_deals: number;
  [key: string]: any;
}

export default function Intelligence() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadSnapshots(); }, []);

  const loadSnapshots = async () => {
    const { data } = await supabase
      .from("intelligence_snapshots" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setSnapshots(data as any[]);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("intelligence");
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setReport(data.report);
      setDataSummary(data.data_summary);
      await loadSnapshots();
      toast.success("Intelligence report generated");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const loadSnapshot = (snap: any) => {
    setReport(snap.insights);
    setDataSummary(snap.data_summary);
    setShowHistory(false);
  };

  const potentialColor = (p: string) =>
    p === "high" ? "text-emerald-400 bg-emerald-500/10" : p === "medium" ? "text-yellow-400 bg-yellow-500/10" : "text-muted-foreground bg-muted";

  const priorityColor = (p: string) =>
    p === "high" ? "text-destructive bg-destructive/10" : p === "medium" ? "text-yellow-400 bg-yellow-500/10" : "text-muted-foreground bg-muted";

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-6xl space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label mb-1">Intelligence Engine</div>
          <p className="text-sm text-muted-foreground">AI-powered agency insights — learns from every lead, proposal, and project</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all">
            <History className="h-3.5 w-3.5" /> Past Reports
          </button>
          <Button onClick={generateReport} disabled={loading} className="rounded-lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Brain className="h-4 w-4 mr-1.5" />}
            {loading ? "Analyzing..." : "Generate Report"}
          </Button>
        </div>
      </motion.div>

      {/* History panel */}
      {showHistory && snapshots.length > 0 && (
        <motion.div variants={fadeUp} className="glass-card rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-foreground mb-2">Past Reports</h3>
          {snapshots.map((s: any) => (
            <button key={s.id} onClick={() => loadSnapshot(s)} className="w-full text-left glass-card rounded-lg p-3 flex items-center justify-between hover:bg-accent/50 transition-all">
              <span className="text-xs text-foreground">Score: {s.insights?.opportunity_score ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Data overview */}
      {dataSummary && (
        <motion.div variants={fadeUp}>
          <div className="section-label mb-3">Data Foundation</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Leads", value: dataSummary.total_leads, icon: Target },
              { label: "Proposals", value: dataSummary.total_proposals, icon: DollarSign },
              { label: "Outreach", value: dataSummary.total_outreach, icon: Mail },
              { label: "Projects", value: dataSummary.total_projects, icon: TrendingUp },
              { label: "Deals", value: dataSummary.total_deals, icon: Lightbulb },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4">
                <s.icon className="h-4 w-4 text-primary mb-2" />
                <div className="font-display text-3xl text-foreground">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!report && !loading && (
        <motion.div variants={fadeUp}>
          <ArdenoEmptyState
            icon={Brain}
            title="No intelligence report yet"
            description='Run "Generate Report" to analyze leads, proposals, outreach, and projects and turn raw agency activity into AI-backed recommendations.'
          />
        </motion.div>
      )}

      {report && (
        <>
          {/* Opportunity Score */}
          <motion.div variants={fadeUp} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className={`font-display text-5xl ${report.opportunity_score >= 70 ? "text-emerald-400" : report.opportunity_score >= 40 ? "text-yellow-400" : "text-destructive"}`}>
                  {report.opportunity_score}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">Agency Opportunity Score</h3>
                <p className="text-xs text-muted-foreground mt-1">{report.executive_summary}</p>
              </div>
            </div>
          </motion.div>

          {/* Top Industries */}
          {report.top_industries.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="section-label mb-3">Top Industries</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.top_industries.map((ind) => (
                  <div key={ind.industry} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{ind.industry}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${potentialColor(ind.potential)}`}>
                        {ind.potential}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="font-display text-2xl text-foreground">{ind.conversion_rate}%</span>
                        <p className="text-[10px] text-muted-foreground">Conversion</p>
                      </div>
                      <div>
                        <span className="font-display text-2xl text-foreground">${ind.avg_value}</span>
                        <p className="text-[10px] text-muted-foreground">Avg Value</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Outreach + Pricing side by side */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Outreach Performance</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="font-display text-2xl text-foreground">{report.outreach_insights.reply_rate}%</span>
                  <p className="text-[10px] text-muted-foreground">Reply Rate</p>
                </div>
                <div>
                  <span className="font-display text-2xl text-foreground">{report.outreach_insights.meeting_rate}%</span>
                  <p className="text-[10px] text-muted-foreground">Meeting Rate</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><span className="text-foreground font-medium">Best method:</span> {report.outreach_insights.best_method}</p>
                <p><span className="text-foreground font-medium">Best subject:</span> {report.outreach_insights.best_subject_pattern}</p>
                <p className="text-primary/80 mt-2">{report.outreach_insights.recommendation}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Pricing Intelligence</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="font-display text-2xl text-foreground">{report.pricing_insights.win_rate}%</span>
                  <p className="text-[10px] text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <span className="font-display text-2xl text-foreground">${report.pricing_insights.avg_proposal_value}</span>
                  <p className="text-[10px] text-muted-foreground">Avg Proposal</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><span className="text-foreground font-medium">Sweet spot:</span> ${report.pricing_insights.sweet_spot_min} – ${report.pricing_insights.sweet_spot_max}</p>
                <p className="text-primary/80 mt-2">{report.pricing_insights.recommendation}</p>
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div variants={fadeUp}>
            <div className="section-label mb-3">Recommended Actions</div>
            <div className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="glass-card rounded-xl p-4 flex items-start gap-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${priorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-primary font-medium">{rec.category}</span>
                    </div>
                    <p className="text-xs text-foreground">{rec.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{rec.expected_impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
