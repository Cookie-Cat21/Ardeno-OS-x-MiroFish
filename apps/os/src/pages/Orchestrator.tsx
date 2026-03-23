import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Send, Loader2, CheckCircle2, XCircle, Copy, ChevronDown, ChevronUp, Save, FolderKanban, Wrench, ExternalLink, Monitor, Tablet, Smartphone, Palette, Globe } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveCharacter from "@/components/InteractiveCharacter";
import { analyzeSentiment, type ExpressionType } from "@/lib/sentiment-analysis";
import { buttonMotion, cardHoverMotion, pageVariants, sectionReveal, ardenoTransitions } from "@/lib/motion";

interface PlanStep { agent_id: string; agent_name: string; task: string; order: number; skills_to_use?: string[]; }
interface StepResult extends PlanStep { result: string; error: boolean; skills_used?: string[]; }
interface OrchestrateResponse { plan: { summary: string; steps: PlanStep[] }; results: StepResult[]; }
interface Project { id: string; client_name: string; project_type: string | null; }

type PreviewDevice = "desktop" | "tablet" | "mobile";

function buildPreviewHtml(code: string, design: any): string {
  const headingFont = design?.headingFont || "Inter";
  const bodyFont = design?.bodyFont || "Inter";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, "+")}:wght@400;500;600;700&family=${bodyFont.replace(/ /g, "+")}:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.opacity-100 { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    if (typeof Website !== 'undefined') root.render(React.createElement(Website));
    else if (typeof App !== 'undefined') root.render(React.createElement(App));
    else {
      const components = Object.keys(window).filter(k => typeof window[k] === 'function' && /^[A-Z]/.test(k));
      if (components.length > 0) root.render(React.createElement(window[components[components.length - 1]]));
    }
  </script>
</body>
</html>`;
}

function tryParseWebsiteBuild(resultStr: string): { _type: string; website_id?: string; code?: string; design?: any; message?: string } | null {
  try {
    const parsed = JSON.parse(resultStr);
    if (parsed._type === "website_build") return parsed;
  } catch {}
  return null;
}

export default function Orchestrator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [response, setResponse] = useState<OrchestrateResponse | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [characterState, setCharacterState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [characterExpression, setCharacterExpression] = useState<ExpressionType>("neutral");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");

  useEffect(() => { supabase.from("projects").select("id, client_name, project_type").order("created_at", { ascending: false }).then(({ data }) => { if (data) setProjects(data); }); }, []);

  const toggleStep = (o: number) => setExpandedSteps((p) => { const n = new Set(p); n.has(o) ? n.delete(o) : n.add(o); return n; });

  const run = async () => {
    if (!task.trim()) return;
    setLoading(true); setResponse(null); setExpandedSteps(new Set()); 
    setCharacterState("processing"); setCharacterExpression("thinking");
    
    try {
      const { data, error } = await supabase.functions.invoke("orchestrate", { body: { task: task.trim(), context: context.trim() || undefined } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      // Analyze the overall response sentiment
      const overallResults = data.results.map((r: StepResult) => r.result).join(" ");
      const hasErrors = data.results.some((r: StepResult) => r.error);
      const expression = hasErrors ? "concerned" : analyzeSentiment(overallResults, "orchestrator");
      
      setResponse(data); 
      setExpandedSteps(new Set(data.results.map((r: StepResult) => r.order))); 
      setCharacterState("success");
      setCharacterExpression(expression);
    } catch (e: any) {
      toast.error(e?.message?.includes("429") ? "Rate limited" : e?.message?.includes("402") ? "Credits exhausted" : e?.message || "Error");
      setCharacterState("error");
      setCharacterExpression("concerned");
    } finally { setLoading(false); }
  };

  const save = async (withProject: boolean) => {
    if (!response) return;
    if (withProject && !selectedProjectId) { toast.error("Select a project"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("orchestrator_results").insert({
        project_id: withProject ? selectedProjectId : null,
        task_input: task, context_input: context || null,
        plan_summary: response.plan.summary, results: response.results as any, created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Saved!");
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={pageVariants}
      className="page-atmosphere min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90"
    >
      {/* Hero Section */}
      <motion.div variants={sectionReveal} className="relative cinematic-surface">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.03)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="relative z-10 pt-16 pb-14 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 1.02, 0.73, 1] }}
            className="mb-10 flex justify-center"
          >
            <div className="relative">
              {/* Character Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20 blur-2xl scale-150"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1.4, 1.6, 1.4]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              
              {/* Main Character */}
              <InteractiveCharacter 
                state={characterState} 
                size="lg" 
                agentId="orchestrator-prime"
                expression={characterExpression}
                className="relative z-10 drop-shadow-2xl scale-110 transform"
              />
              
              {/* Floating Data Points */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-accent rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    x: [0, (Math.cos(i * 60 * Math.PI / 180) * 60)],
                    y: [0, (Math.sin(i * 60 * Math.PI / 180) * 60)],
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: '50%',
                    top: '50%'
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            <motion.div 
              className="inline-flex items-center gap-2 rounded-full border border-primary/24 bg-gradient-to-r from-primary/12 to-accent/12 px-4 py-2 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="font-data text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Orchestrator</span>
            </motion.div>
            
            <h1 className="font-display text-[clamp(2.2rem,4vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-foreground">
              Master Agent
              <span className="block text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-clip-text">
                Coordination
              </span>
            </h1>
            <p className="mx-auto max-w-[42rem] text-[15px] leading-7 text-muted-foreground md:text-base">
              Describe your objective and watch as the orchestrator intelligently delegates tasks to specialist agents
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="page-shell max-w-4xl space-y-8 pt-0">
        {/* Input Form */}
        <motion.div variants={sectionReveal}>
          <div className="glass-card cinematic-surface rounded-2xl p-8 border-2 border-border/30 backdrop-blur-xl bg-card/50">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <label className="text-sm font-semibold text-foreground">Objective</label>
                  <span className="text-xs text-muted-foreground">• Required</span>
                </div>
                <Textarea 
                  value={task} 
                  onChange={(e) => setTask(e.target.value)} 
                  placeholder="What do you want to achieve? Be specific about your goals and requirements..." 
                  className="bg-background/50 border-border/50 rounded-xl min-h-[100px] text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200" 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  <label className="text-sm font-semibold text-foreground">Context</label>
                  <span className="text-xs text-muted-foreground">• Optional</span>
                </div>
                <Textarea 
                  value={context} 
                  onChange={(e) => setContext(e.target.value)} 
                  placeholder="Any additional context, constraints, or background information..." 
                  className="bg-background/50 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200" 
                  rows={3} 
                />
              </div>
              
              <motion.div className="pt-2" {...buttonMotion}>
                <Button 
                  onClick={run} 
                  disabled={!task.trim() || loading} 
                  className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                      <span>Orchestrating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> 
                      <span>Execute Plan</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-12 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
          >
            <div className="space-y-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Enhanced loading character with better centering */}
                <div className="relative flex justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-accent/40 to-primary/30 blur-xl scale-125"
                    animate={{ 
                      scale: [1.2, 1.4, 1.2],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                  <InteractiveCharacter 
                    state="processing" 
                    size="lg" 
                    agentId="orchestrator-prime"
                    expression="thinking"
                    className="relative z-10 scale-110"
                  />
                </div>
              </motion.div>
              
              <div className="space-y-3">
                <motion.div 
                  className="flex justify-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </motion.div>
                <p className="text-primary font-medium">Analyzing your objective</p>
                <p className="text-sm text-muted-foreground">Identifying specialist agents and creating execution plan...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {response && (
          <AnimatePresence>
            <motion.div 
              variants={sectionReveal} 
              initial="hidden" 
              animate="show" 
              className="space-y-6"
            >
              {/* Plan Overview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card cinematic-surface orange-glow-soft rounded-2xl overflow-hidden border-l-4 border-l-primary shadow-lg"
              >
                <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">Execution Plan</span>
                        <div className="h-1 w-1 rounded-full bg-primary/50" />
                        <span className="text-xs text-muted-foreground">{response.results.length} agents</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{response.plan.summary}</p>
                    </div>
                  </div>
                  
                  {/* Agent Pills */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/20">
                    {response.results.map((r, index) => (
                      <motion.span 
                        key={r.order}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-full border backdrop-blur-sm ${
                          r.error 
                            ? "border-destructive/30 text-destructive bg-destructive/10" 
                            : "border-success/30 text-success bg-success/10"
                        }`}
                      >
                        {r.error ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {r.agent_name}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Save Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card cinematic-surface rounded-2xl p-6 border border-border/50"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground mb-1">Save Results</h3>
                      <p className="text-xs text-muted-foreground">Attach to a project or save as standalone</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="bg-background/50 border-border/50 h-10 w-full sm:w-64 rounded-xl text-sm">
                        <SelectValue placeholder="Select project..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.client_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => save(true)} 
                        disabled={!selectedProjectId || saving} 
                        className="h-10 rounded-xl bg-primary/90 hover:bg-primary text-primary-foreground px-4"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Save</>}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => save(false)} 
                        disabled={saving} 
                        className="h-10 rounded-xl border-border/50 hover:bg-secondary/50 px-4"
                      >
                        Standalone
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Agent Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-foreground mb-4">Agent Outputs</h3>
                {response.results.map((result, index) => (
                  <motion.div 
                    key={result.order}
                    variants={sectionReveal}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div {...cardHoverMotion} className={`glass-card rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                      result.error 
                        ? "border-destructive/20 bg-destructive/5" 
                        : expandedSteps.has(result.order)
                        ? "border-primary/30 bg-primary/5 orange-glow-soft"
                        : "border-border/30 hover:border-primary/20"
                    }`}>
                      <motion.button 
                        onClick={() => toggleStep(result.order)} 
                        className="w-full text-left p-6 flex items-center justify-between hover:bg-background/30 transition-colors duration-200"
                        whileHover={{ scale: 1.001 }}
                        whileTap={{ scale: 0.999 }}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                            result.error 
                              ? "bg-destructive/20 text-destructive" 
                              : "bg-success/20 text-success"
                          }`}>
                            {result.error ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-semibold text-primary">{result.agent_name}</span>
                              <span className="text-xs bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-md">
                                Step {result.order}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.task}
                            </p>
                            {result.skills_used && result.skills_used.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Wrench className="h-3 w-3 text-accent" />
                                {result.skills_used.map((skill) => (
                                  <span key={skill} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <motion.div
                          animate={{ rotate: expandedSteps.has(result.order) ? 180 : 0 }}
                        transition={ardenoTransitions.fast}
                        className="flex-shrink-0"
                      >
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </motion.button>
                      
                      <AnimatePresence>
                        {expandedSteps.has(result.order) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.21, 1.02, 0.73, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 border-t border-border/30">
                              {(() => {
                                const websiteBuild = tryParseWebsiteBuild(result.result);
                                if (websiteBuild && websiteBuild.code) {
                                  const deviceWidths: Record<PreviewDevice, string> = { desktop: "100%", tablet: "768px", mobile: "375px" };
                                  const deviceIcons: Record<PreviewDevice, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
                                  return (
                                    <div className="mt-4 space-y-4">
                                      {/* Summary card */}
                                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                                        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                          <Globe className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-foreground">{websiteBuild.message}</p>
                                          {websiteBuild.design && (
                                            <div className="flex items-center gap-3 mt-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <Palette className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">{websiteBuild.design.style}</span>
                                              </div>
                                              <div className="flex gap-1">
                                                {[websiteBuild.design.primaryColor, websiteBuild.design.secondaryColor, websiteBuild.design.accentColor].filter(Boolean).map((c: string, i: number) => (
                                                  <div key={i} className="h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                                                ))}
                                              </div>
                                              <span className="text-[10px] text-muted-foreground">{websiteBuild.design.headingFont}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Device switcher */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Preview</span>
                                        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                                          {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map(d => {
                                            const Icon = deviceIcons[d];
                                            return (
                                              <button
                                                key={d}
                                                onClick={() => setPreviewDevice(d)}
                                                className={`p-1.5 rounded-md transition-colors ${previewDevice === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                              >
                                                <Icon className="h-3.5 w-3.5" />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Iframe preview */}
                                      <div className="rounded-xl border-2 border-border/30 bg-white overflow-hidden flex justify-center">
                                        <iframe
                                          srcDoc={buildPreviewHtml(websiteBuild.code, websiteBuild.design)}
                                          className="border-0 transition-all duration-300"
                                          style={{ width: deviceWidths[previewDevice], height: "500px" }}
                                          sandbox="allow-scripts"
                                          title="Website Preview"
                                        />
                                      </div>

                                      {/* Actions */}
                                      <div className="flex justify-end gap-2">
                                        {websiteBuild.website_id && (
                                          <motion.button
                                            onClick={() => navigate(`/website-builder?id=${websiteBuild.website_id}`)}
                                            className="text-xs text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Open in Site Builder
                                          </motion.button>
                                        )}
                                        <motion.button
                                          onClick={() => { navigator.clipboard.writeText(websiteBuild.code!); toast.success("Code copied"); }}
                                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background/50"
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                          Copy Code
                                        </motion.button>
                                      </div>
                                    </div>
                                  );
                                }

                                // Default: markdown rendering for non-website results
                                return (
                                  <>
                                    <div className="bg-background/50 rounded-xl p-6 mt-4 backdrop-blur-sm border border-border/20">
                                      <div className="prose prose-sm prose-invert max-w-none [&_p]:text-foreground/80 [&_li]:text-foreground/80 [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_code]:text-accent [&_code]:bg-accent/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                                        <ReactMarkdown>{result.result}</ReactMarkdown>
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                      <motion.button
                                        onClick={() => { navigator.clipboard.writeText(result.result); toast.success("Copied to clipboard"); }}
                                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background/50"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy Output
                                      </motion.button>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
