import { useAuth } from "@/contexts/AuthContext";
import { AGENTS } from "@/lib/agents";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, Orbit, Activity } from "lucide-react";
import { PageTransition, FadeChild } from "@/components/MotionPrimitives";
import { ArdenoMark } from "@/components/brand/ArdenoBrand";
import { Button } from "@/components/ui/button";

import KPIStrip from "@/components/dashboard/KPIStrip";
import RevenueSparkline from "@/components/dashboard/RevenueSparkline";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import ActiveAgentCards from "@/components/dashboard/ActiveAgentCards";
import RealActivityFeed from "@/components/dashboard/RealActivityFeed";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import DailyBriefing from "@/components/dashboard/DailyBriefing";
import GoalTracking from "@/components/dashboard/GoalTracking";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/60">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
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
    <PageTransition className="page-shell max-w-[1440px]">
      <FadeChild className="mb-6">
        <div className="ardeno-panel ambient-glow overflow-hidden rounded-[28px] px-5 py-6 sm:px-6 md:px-7 md:py-8 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,79,0,0.1),transparent_28%)]" />
          <div className="relative z-[1] grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="brand-chip">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Ardeno Studio Command Center
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {activeAgents} Agents Online
                </span>
              </div>

              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:text-xs">{getGreeting()}, {firstName}</p>
              <h1 className="mt-3 max-w-[13ch] font-display text-[clamp(2.15rem,4vw,3.7rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-foreground">
                Ardeno OS is live with a sharper view of revenue, delivery, and AI execution.
              </h1>
              <p className="mt-4 max-w-[42rem] text-[15px] leading-7 text-muted-foreground md:text-base">
                Everything critical is surfaced here: operational momentum, high-value work, pipeline movement, and your active AI workforce.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button size="lg" className="min-w-[198px] justify-between gap-3 px-5 md:min-w-[212px]">
                  Open Daily Briefing
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="min-w-[198px] justify-between gap-3 px-5 md:min-w-[212px]">
                  Review Agent Activity
                  <Orbit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="ardeno-panel rounded-[22px] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Revenue Signal</span>
                  <ArdenoMark className="h-9 w-9 p-2" glow />
                </div>
                <div className="font-display text-3xl text-foreground">${dbStats.revenue.toLocaleString()}</div>
                <p className="mt-1 text-sm text-muted-foreground">Pipeline value currently tracked in the system.</p>
              </div>
              <div className="ardeno-panel rounded-[22px] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Delivery Load</span>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="font-display text-3xl text-foreground">{dbStats.projects}</div>
                <p className="mt-1 text-sm text-muted-foreground">Active projects and ongoing client delivery commitments.</p>
              </div>
              <div className="ardeno-panel rounded-[22px] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Lead Flow</span>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="font-display text-3xl text-foreground">{dbStats.leads}</div>
                <p className="mt-1 text-sm text-muted-foreground">New and active opportunities currently feeding the business engine.</p>
              </div>
            </div>
          </div>
        </div>
      </FadeChild>

      <FadeChild className="mb-6">
        <KPIStrip
          data={{
            revenue: dbStats.revenue,
            activeAgents,
            leads: dbStats.leads,
            projects: dbStats.projects,
          }}
        />
      </FadeChild>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <FadeChild>
            <SectionLabel>Revenue & Pipeline</SectionLabel>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RevenueSparkline />
              <PipelineFunnel />
            </div>
          </FadeChild>
        </div>

        <div className="space-y-5">
          <FadeChild>
            <SectionLabel>AI Agents</SectionLabel>
            <ActiveAgentCards />
          </FadeChild>

          <FadeChild>
            <SectionLabel>Recent Activity</SectionLabel>
            <div className="dash-card max-h-[320px] overflow-hidden overflow-y-auto">
              <RealActivityFeed />
            </div>
          </FadeChild>
        </div>
      </div>

      <FadeChild className="mb-6">
        <SectionLabel>Tasks & Intelligence</SectionLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UpcomingTasks />
          <DailyBriefing />
        </div>
      </FadeChild>

      <FadeChild>
        <SectionLabel>Monthly Goals</SectionLabel>
        <GoalTracking />
      </FadeChild>
    </PageTransition>
  );
}
