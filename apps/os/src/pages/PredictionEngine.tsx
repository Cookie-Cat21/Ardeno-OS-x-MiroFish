import React, { useState, useRef, useEffect } from "react";
import { 
  Brain, 
  Upload, 
  Send, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  FileText, 
  History, 
  Users, 
  Globe,
  Database,
  Terminal,
  Activity,
  ArrowRight,
  Kanban,
  Zap,
  TrendingUp,
  Cpu
} from "lucide-react";
import AgencySpatialView from "@/components/AgencySpatialView";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { mirofishBridge, RunStatusResponse, StrategicReport } from "@/lib/mirofish-bridge";

type Step = "setup" | "agency_board" | "preparing" | "running" | "reporting" | "finished";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;

const PredictionEngine = () => {
  const [currentStep, setCurrentStep] = useState<Step>("setup");
  const [files, setFiles] = useState<File[]>([]);
  const [requirement, setRequirement] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Agency State
  const [agencyGoal, setAgencyGoal] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [agencyTickets, setAgencyTickets] = useState<any[]>([]);
  
  // Simulation & Sentience
  const [agents, setAgents] = useState<any[]>([]);
  const [reportData, setReportData] = useState<StrategicReport | null>(null);
  
  // Progress
  const [prepProgress, setPrepProgress] = useState(0);
  const [prepMessage, setPrepMessage] = useState("");
  const [actions, setActions] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    const fetchSignals = async () => {
      const res = await mirofishBridge.getAgencyInbox();
      if (res.success) setSignals(res.data?.signals || []);
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      const res = await mirofishBridge.getAgents();
      if (res.success) setAgents(res.data || []);
    };
    fetchAgents();
  }, []);

  const startAgencyProject = async () => {
    if (!agencyGoal.trim()) return toast.error("Please enter a goal.");
    const res = await mirofishBridge.startAgencyProject(agencyGoal);
    if (res.success && res.data?.project_id) {
      setActiveProjectId(res.data.project_id);
      setCurrentStep("agency_board");
      toast.success("Autonomous Mission Initiated.");
    }
  };

  const renderSetup = () => (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="max-w-6xl mx-auto space-y-8 mt-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Ardeno OS Agency society</h1>
          <p className="text-muted-foreground font-medium">Self-Optimizing Autonomous Parallel Intelligence</p>
        </div>
        <div className="flex gap-4">
           <div className="glass-card px-4 py-3 rounded-2xl border-primary/20 bg-primary/5 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-primary" />
              <div>
                <div className="text-[10px] uppercase font-black opacity-60">Sentience Rank</div>
                <div className="text-sm font-black text-primary tracking-tighter">LVL 04 / Optimizing</div>
              </div>
           </div>
        </div>
      </div>

      <Tabs defaultValue="mission" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-8">
          <TabsTrigger value="mission" className="rounded-xl px-8 h-12 font-black text-xs uppercase tracking-widest">Active Mission</TabsTrigger>
          <TabsTrigger value="foresight" className="rounded-xl px-8 h-12 font-black text-xs uppercase tracking-widest">Foresight Unit</TabsTrigger>
          <TabsTrigger value="spatial" className="rounded-xl px-8 h-12 font-black text-xs uppercase tracking-widest">Spatial Hub</TabsTrigger>
          <TabsTrigger value="evolution" className="rounded-xl px-8 h-12 font-black text-xs uppercase tracking-widest">Agency Evolution</TabsTrigger>
        </TabsList>

        <TabsContent value="spatial" className="outline-none">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <AgencySpatialView />
           </motion.div>
        </TabsContent>

        <TabsContent value="mission" className="space-y-8 outline-none">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="glass-card border-none shadow-2xl p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-emerald-500/5 ring-1 ring-primary/10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <Zap className="w-10 h-10 text-primary" />
                       <h3 className="text-2xl font-black tracking-tight">Deploy Autonomous Swarm</h3>
                    </div>
                    <Textarea 
                      placeholder="e.g., 'Analyze the ROI of a new SaaS feature and build the landing page design.'"
                      className="min-h-[140px] text-xl bg-white/60 p-6 rounded-3xl border-none shadow-sm focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      value={agencyGoal}
                      onChange={(e) => setAgencyGoal(e.target.value)}
                    />
                    <Button size="lg" className="w-full h-18 rounded-[1.5rem] text-xl font-black shadow-2xl bg-primary hover:bg-primary/95 transition-all group" onClick={startAgencyProject}>
                      Initiate Agency Labor <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-1">
                 <Card className="glass-card h-full border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white/90 p-8">
                       <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                         <Activity className="w-4 h-4 text-emerald-400" /> Agency Pulse
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <ScrollArea className="h-[350px]">
                          <div className="divide-y divide-slate-100">
                             {agents.slice(0, 10).map((a, i) => (
                               <div key={i} className="p-4 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-sm">{a.name[0]}</div>
                                  <div className="flex-1 overflow-hidden">
                                     <div className="text-xs font-black text-slate-800 tracking-tight flex items-center justify-between">
                                        {a.name}
                                        <Badge variant="outline" className="text-[8px] bg-slate-100">{a.performance_elo || 1000}</Badge>
                                     </div>
                                     <div className="text-[9px] font-black text-primary uppercase opacity-60 mt-0.5">{a.role}</div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </ScrollArea>
                    </CardContent>
                 </Card>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="evolution" className="outline-none">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="glass-card border-none shadow-xl rounded-[2.5rem] p-8 space-y-6">
                 <div className="p-4 bg-emerald-50 rounded-2xl w-fit"><TrendingUp className="w-8 h-8 text-emerald-600" /></div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                   <Globe className="w-3 h-3" /> Live Global signals
                 </h4>
                 <div className="space-y-3">
                    {signals.map((s, i) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-slate-400">{s.source}</span>
                          <Badge variant={s.impact === 'high' ? 'destructive' : 'secondary'} className="text-[8px] h-4">IMPACT {s.impact}</Badge>
                        </div>
                        <p className="text-[11px] font-medium leading-tight text-slate-700">"{s.content}"</p>
                      </motion.div>
                    ))}
                 </div>
              </div>
              </Card>
              {/* Add more evolution metrics cards here */}
           </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  // Placeholder for missing renders to keep file valid
  const renderAgencyBoard = () => (
    <div className="max-w-6xl mx-auto mt-20 p-20 glass-card rounded-[3rem] text-center space-y-8">
       <Kanban className="w-20 h-20 text-primary mx-auto opacity-20" />
       <h2 className="text-4xl font-black">Agency Active Board</h2>
       <p className="text-xl text-muted-foreground font-medium">Tracking multi-departmental tickets for PROJECT: {activeProjectId}</p>
       <Button onClick={() => setCurrentStep("setup")} className="h-16 px-12 rounded-2xl font-black">Return to HQ</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFC] p-8 md:p-12 font-sans">
      <AnimatePresence mode="wait">
        <motion.div key={currentStep}>
          {currentStep === "setup" && renderSetup()}
          {currentStep === "agency_board" && renderAgencyBoard()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PredictionEngine;
