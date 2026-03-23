import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe, Search, Loader2, Mail, Plus, History, Download,
  Layers, GitCompare, X, ChevronDown, ChevronUp, FileText, FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { pageVariants, sectionReveal } from "@/lib/motion";
interface AuditSection {
  name: string;
  score: number;
  findings: string[];
}

interface AuditResult {
  url: string;
  overall_score: number;
  sections: AuditSection[];
  recommendations: string[];
  summary?: string;
}

interface SavedAudit {
  id: string;
  url: string;
  overall_score: number | null;
  scores: any;
  findings: any;
  recommendations: any;
  created_at: string | null;
}

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
} as const;

/* ─── score gauge ─── */
function ScoreGauge({ score, size = "lg" }: { score: number; size?: "lg" | "sm" }) {
  const color =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-destructive";
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display ${size === "lg" ? "text-5xl" : "text-3xl"} ${color}`}>
        {score}
      </span>
      <span className="text-xs text-muted-foreground">/100</span>
    </div>
  );
}

/* ─── score badge ─── */
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-400"
      : score >= 60
      ? "bg-yellow-500/10 text-yellow-400"
      : "bg-destructive/10 text-destructive";
  return <span className={`text-xs font-data px-2 py-0.5 rounded-md ${cls}`}>{score}/100</span>;
}

/* ─── single audit card ─── */
function AuditCard({
  result,
  compare,
  onAddToLeads,
}: {
  result: AuditResult;
  compare?: AuditResult;
  onAddToLeads: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Overall score */}
      <div className="glass-card rounded-xl p-6 flex flex-wrap items-center gap-6">
        <ScoreGauge score={result.overall_score} />
        <div className="flex-1 min-w-[180px]">
          <h3 className="text-sm font-medium text-foreground truncate">{result.url}</h3>
          {result.summary ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.summary}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              {result.overall_score >= 80
                ? "Good overall — minor improvements needed"
                : result.overall_score >= 60
                ? "Decent — several areas for improvement"
                : "Needs significant work"}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => toast.success("Drafting cold outreach email")}
            className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Mail className="h-3.5 w-3.5" /> Cold Outreach
          </button>
          <button
            onClick={() => onAddToLeads(result.url)}
            className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add to Leads
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Section score grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {result.sections.map((section) => {
                const color =
                  section.score >= 80
                    ? "text-emerald-400"
                    : section.score >= 60
                    ? "text-yellow-400"
                    : "text-destructive";
                const compSection = compare?.sections.find((s) => s.name === section.name);
                return (
                  <div key={section.name} className="glass-card rounded-xl p-4">
                    <div className="flex items-end gap-2">
                      <div className={`font-display text-3xl ${color}`}>{section.score}</div>
                      {compSection && (
                        <span className="text-xs text-muted-foreground mb-1">
                          vs {compSection.score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground mt-1">{section.name}</p>
                  </div>
                );
              })}
            </div>

            {/* Detailed findings */}
            {result.sections.map((section) => (
              <div key={section.name} className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-foreground">{section.name}</span>
                  <ScoreBadge score={section.score} />
                </div>
                <ul className="space-y-1.5">
                  {section.findings.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Recommendations */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-medium text-foreground mb-3">Top Recommendations</h3>
              <ol className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-3">
                    <span className="text-primary font-data font-medium shrink-0">{i + 1}.</span> {r}
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── export helpers ─── */
function exportMarkdown(result: AuditResult): string {
  let md = `# Website Audit: ${result.url}\n\n`;
  md += `**Overall Score:** ${result.overall_score}/100\n\n`;
  if (result.summary) md += `> ${result.summary}\n\n`;
  for (const s of result.sections) {
    md += `## ${s.name} — ${s.score}/100\n\n`;
    for (const f of s.findings) md += `- ${f}\n`;
    md += "\n";
  }
  md += `## Recommendations\n\n`;
  result.recommendations.forEach((r, i) => (md += `${i + 1}. ${r}\n`));
  return md;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf(result: AuditResult) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxW = pw - margin * 2;
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkPage = (need: number) => { if (y + need > 275) addPage(); };

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Website Audit Report", margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(result.url, margin, y);
  y += 6;
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 12;

  // Overall score
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall Score: ${result.overall_score}/100`, margin, y);
  y += 8;

  if (result.summary) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(result.summary, maxW);
    checkPage(lines.length * 4 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 6;
  }

  // Sections
  for (const section of result.sections) {
    checkPage(20);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${section.name} — ${section.score}/100`, margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    for (const f of section.findings) {
      const lines = doc.splitTextToSize(`• ${f}`, maxW - 4);
      checkPage(lines.length * 4 + 2);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4 + 1;
    }
    y += 4;
  }

  // Recommendations
  checkPage(14);
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Recommendations", margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  result.recommendations.forEach((r, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${r}`, maxW - 4);
    checkPage(lines.length * 4 + 2);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4 + 1;
  });

  const host = new URL(result.url).hostname.replace(/\./g, "-");
  doc.save(`audit-${host}.pdf`);
}

/* ─── main component ─── */
export default function WebsiteAnalyzer() {
  const [mode, setMode] = useState<"single" | "bulk" | "compare">("single");
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [compareUrl, setCompareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [history, setHistory] = useState<SavedAudit[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("website_audits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data as SavedAudit[]);
  };

  const saveAudit = async (result: AuditResult) => {
    const scores: Record<string, number> = {};
    result.sections.forEach((s) => (scores[s.name] = s.score));
    await supabase.from("website_audits").insert({
      url: result.url,
      overall_score: result.overall_score,
      scores,
      findings: result.sections,
      recommendations: result.recommendations,
    } as any);
  };

  const addToLeads = async (leadUrl: string) => {
    const { error } = await supabase.from("leads").insert({
      name: new URL(leadUrl).hostname,
      url: leadUrl,
      status: "New",
    } as any);
    if (error) {
      toast.error("Failed to add lead");
    } else {
      toast.success("Added to leads");
    }
  };

  const analyze = async () => {
    let urls: string[] = [];

    if (mode === "single") {
      if (!url.trim()) return;
      urls = [url.trim()];
    } else if (mode === "bulk") {
      urls = bulkUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      if (urls.length === 0) return;
    } else if (mode === "compare") {
      if (!url.trim() || !compareUrl.trim()) {
        toast.error("Enter both URLs for comparison");
        return;
      }
      urls = [url.trim(), compareUrl.trim()];
    }

    // Normalize URLs
    urls = urls.map((u) => (u.startsWith("http") ? u : `https://${u}`));

    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("website-audit", {
        body: { urls },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      const auditResults: AuditResult[] = data.results;
      setResults(auditResults);

      // Save all audits
      for (const r of auditResults) {
        await saveAudit(r);
      }
      await loadHistory();
      toast.success(`Audit complete — ${auditResults.length} site(s) analyzed`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (audit: SavedAudit) => {
    const sections: AuditSection[] = Array.isArray(audit.findings)
      ? (audit.findings as any[]).map((f: any) => ({
          name: f.name || "Unknown",
          score: f.score || 0,
          findings: f.findings || [],
        }))
      : [];
    setResults([
      {
        url: audit.url,
        overall_score: audit.overall_score || 0,
        sections,
        recommendations: Array.isArray(audit.recommendations) ? (audit.recommendations as string[]) : [],
      },
    ]);
    setShowHistory(false);
  };

  const handleExport = (format: "md" | "txt") => {
    if (results.length === 0) return;
    for (const r of results) {
      const md = exportMarkdown(r);
      const host = new URL(r.url).hostname.replace(/\./g, "-");
      if (format === "md") {
        downloadFile(md, `audit-${host}.md`, "text/markdown");
      } else {
        downloadFile(md, `audit-${host}.txt`, "text/plain");
      }
    }
    toast.success("Exported");
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={pageVariants}
      className="page-shell page-atmosphere max-w-5xl space-y-6"
    >
      {/* Header */}
      <motion.div variants={sectionReveal} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label mb-1">Website Analyzer</div>
          <p className="text-sm text-muted-foreground">
            AI-powered design, SEO, copy, and performance audit
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <History className="h-3.5 w-3.5" /> History
          </button>
          {results.length > 0 && (
            <>
              <button
                onClick={() => handleExport("md")}
                className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Markdown
              </button>
              <button
                onClick={() => handleExport("txt")}
                className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <FileText className="h-3.5 w-3.5" /> Text
              </button>
              <button
                onClick={() => { for (const r of results) exportPdf(r); toast.success("PDF exported"); }}
                className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Mode switcher */}
      <motion.div variants={sectionReveal} className="flex gap-2 flex-wrap">
        {[
          { id: "single" as const, label: "Single URL", icon: Globe },
          { id: "bulk" as const, label: "Bulk Analyze", icon: Layers },
          { id: "compare" as const, label: "Compare", icon: GitCompare },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === m.id
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </button>
        ))}
      </motion.div>

      {/* Input area */}
      <motion.div variants={sectionReveal} className="glass-card cinematic-surface rounded-xl p-5">
        {mode === "single" && (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                className="bg-secondary/50 border-border/50 pl-10 rounded-lg"
              />
            </div>
            <Button onClick={analyze} disabled={!url.trim() || loading} className="rounded-lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        )}

        {mode === "bulk" && (
          <div className="space-y-3">
            <Textarea
              placeholder={"https://site1.com\nhttps://site2.com\nhttps://site3.com\n\n(up to 5 URLs, one per line)"}
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-lg min-h-[120px] text-sm"
            />
            <Button
              onClick={analyze}
              disabled={!bulkUrls.trim() || loading}
              className="rounded-lg w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Layers className="h-4 w-4 mr-1.5" />}
              {loading ? "Analyzing..." : `Analyze ${bulkUrls.split("\n").filter((u) => u.trim()).length} sites`}
            </Button>
          </div>
        )}

        {mode === "compare" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://your-site.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-secondary/50 border-border/50 pl-10 rounded-lg"
                />
              </div>
              <div className="relative">
                <GitCompare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://competitor.com"
                  value={compareUrl}
                  onChange={(e) => setCompareUrl(e.target.value)}
                  className="bg-secondary/50 border-border/50 pl-10 rounded-lg"
                />
              </div>
            </div>
            <Button
              onClick={analyze}
              disabled={!url.trim() || !compareUrl.trim() || loading}
              className="rounded-lg w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <GitCompare className="h-4 w-4 mr-1.5" />}
              {loading ? "Comparing..." : "Compare Sites"}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="shimmer h-3 w-48 rounded-lg" />
          <div className="shimmer h-3 w-32 rounded-lg" />
          <p className="text-sm text-muted-foreground mt-4">Running AI audit agents...</p>
        </div>
      )}

      {/* History panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Recent Audits</h3>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No audits yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((audit) => (
                    <button
                      key={audit.id}
                      onClick={() => loadFromHistory(audit)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-all text-left"
                    >
                      <ScoreGauge score={audit.overall_score || 0} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{audit.url}</p>
                        <p className="text-xs text-muted-foreground">
                          {audit.created_at
                            ? new Date(audit.created_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className="space-y-8">
          {/* Comparison summary */}
          {mode === "compare" && results.length === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6"
            >
              <h3 className="text-sm font-medium text-foreground mb-4">Side-by-Side Comparison</h3>
              <div className="grid grid-cols-2 gap-6">
                {results.map((r) => (
                  <div key={r.url} className="text-center">
                    <ScoreGauge score={r.overall_score} />
                    <p className="text-xs text-muted-foreground mt-2 truncate">{r.url}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {results[0].sections.map((s, i) => {
                  const s2 = results[1].sections[i];
                  const winner = s.score > (s2?.score || 0) ? 0 : s.score < (s2?.score || 0) ? 1 : -1;
                  return (
                    <div key={s.name} className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{s.name}</p>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className={winner === 0 ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {s.score}
                        </span>
                        <span className="text-muted-foreground/50">vs</span>
                        <span className={winner === 1 ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {s2?.score || "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {results.map((result, idx) => (
            <AuditCard
              key={result.url}
              result={result}
              compare={mode === "compare" && results.length === 2 ? results[1 - idx] : undefined}
              onAddToLeads={addToLeads}
            />
          ))}
        </div>
      )}
      {!loading && results.length === 0 && !showHistory && (
        <ArdenoEmptyState
          icon={Search}
          title="No audits yet"
          description="Run a branded Ardeno audit to evaluate design, performance, SEO, and messaging with cinematic clarity."
        />
      )}
    </motion.div>
  );
}
