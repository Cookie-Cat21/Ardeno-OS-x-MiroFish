import { useAuth } from "@/contexts/AuthContext";
import { AGENTS } from "@/lib/agents";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, Plus, Search, Globe, Zap, MessageSquare } from "lucide-react";
import { PageTransition, FadeChild } from "@/components/MotionPrimitives";
import { ArdenoMark } from "@/components/brand/ArdenoBrand";
import { Button } from "@/components/ui/button";
import InteractiveAuroraCharacter from "@/components/InteractiveAuroraCharacter";

import KPIStrip from "@/components/dashboard/KPIStrip";
import SimulationStatus from "@/components/dashboard/SimulationStatus";
import ThoughtBubbleFeed from "@/components/dashboard/ThoughtBubbleFeed";
import RealActivityFeed from "@/components/dashboard/RealActivityFeed";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import DailyBriefing from "@/components/dashboard/DailyBriefing";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Index() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator";
  const [dbStats, setDbStats] = useState({ projects: 0, tasks: 0, proposals: 0, leads: 0, revenue: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "Done"),
      supabase.from("proposals").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("pipeline_deals").select("value"),
    ]).then(([projects, tasks, proposals, leads, deals]) => {
      const revenue = (deals.data ?? []).reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
      setDbStats({
        projects: projects.count || 0,
        tasks: tasks.count || 0,
        proposals: proposals.count || 0,
        leads: leads.count || 0,
        revenue,
      });
    });
  }, []);

  const activeAgents = AGENTS.filter((agent) => agent.enabled).length;

  return (
    <PageTransition className="max-w-[1500px] mx-auto space-y-8">
      {/* 1. HERO: THE SENTIENT SURFACE */}
      <FadeChild>
        <div className="arden-card relative flex flex-col items-center justify-center py-12 px-6 text-center overflow-hidden border-none shadow-none bg-transparent">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.05),transparent_60%)]" />
          
          <div className="mb-8 p-1 rounded-full border border-white bg-white/40 shadow-xl">
             <InteractiveAuroraCharacter state="idle" size="lg" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-[800px]"
          >
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500/70">
              <span className="h-1 w-1 rounded-full bg-blue-500" />
              {getGreeting()}, {firstName}
            </div>
            <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[0.9] tracking-[-0.04em] text-slate-900">
              Your society is working on high-value delivery.
            </h1>
            <p className="mx-auto mt-4 max-w-[560px] text-base md:text-lg font-medium text-slate-500/90 leading-relaxed">
              Ardeno OS is now fully integrated with 512 agents. Simulation active across 9 departments.
            </p>
          </motion.div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-14 rounded-2xl px-8 text-base shadow-lg shadow-blue-500/10">
              Talk to Orchestrator
              <MessageSquare className="ml-3 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 rounded-2xl px-8 text-base border-slate-200/60 bg-white/40">
              Review Board 
              <Globe className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </FadeChild>

      {/* 2. CORE HUD: KPI STRIP */}
      <FadeChild>
        <KPIStrip
          data={{
            revenue: dbStats.revenue,
            activeAgents,
            leads: dbStats.leads,
            projects: dbStats.projects,
          }}
        />
      </FadeChild>

      {/* 3. SIMULATION & THOUGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <FadeChild>
          <SimulationStatus />
        </FadeChild>
        <FadeChild>
          <ThoughtBubbleFeed />
        </FadeChild>
      </div>

      {/* 4. OPERATIONAL Momentum */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <FadeChild>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Task Pipeline</h4>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <UpcomingTasks />
          </div>
        </FadeChild>
        <FadeChild>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Daily Intelligence</h4>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <DailyBriefing />
          </div>
        </FadeChild>
      </div>
    </PageTransition>
  );
}
