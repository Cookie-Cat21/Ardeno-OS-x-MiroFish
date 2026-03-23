import { useAuth } from "@/contexts/AuthContext";
import { AGENTS } from "@/lib/agents";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, MessageSquare, Globe, Zap } from "lucide-react";
import { PageTransition, FadeChild } from "@/components/MotionPrimitives";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import InteractiveAuroraCharacter from "@/components/InteractiveAuroraCharacter";

import SimulationStatus from "@/components/dashboard/SimulationStatus";
import ThoughtBubbleFeed from "@/components/dashboard/ThoughtBubbleFeed";
import ActiveAgentCards from "@/components/dashboard/ActiveAgentCards";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Index() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator";

  return (
    <PageTransition className="max-w-[1500px] mx-auto space-y-12 pb-24">
      {/* 1. CORE INTERFACE: THE ORCHESTRATOR */}
      <FadeChild>
        <div className="relative flex flex-col items-center justify-center pt-24 pb-12 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.06),transparent_70%)]" />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-10 p-2 rounded-full border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(0,122,255,0.15)] ring-1 ring-slate-100"
          >
             <InteractiveAuroraCharacter state="idle" size="lg" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6 max-w-[800px]"
          >
            <div className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-500/80">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,122,255,0.8)]" />
              {getGreeting()}, {firstName}
            </div>
            <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[0.9] tracking-[-0.05em] text-slate-900 mb-6 drop-shadow-sm">
            Ardeno OS <br />
            <span className="text-slate-400 font-medium">Powered by MiroFish</span>
          </h1>
          <p className="max-w-[600px] text-lg font-medium text-slate-500 leading-relaxed mb-10">
            A high-fidelity sentient agency environment. 512 specialized agents 
            collaborating in a parallel society to build your vision.
          </p>
          </motion.div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
            <Button asChild size="lg" className="h-16 rounded-[24px] px-10 text-[17px] font-bold shadow-2xl shadow-blue-500/20 bg-primary hover:scale-[1.02] transition-transform">
              <Link to="/chat" className="flex items-center">
                Talk to Orchestrator
                <MessageSquare className="ml-3 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 rounded-[24px] px-10 text-[17px] font-bold border-slate-200/50 bg-white/40 backdrop-blur-md hover:bg-white/80 transition-colors">
              <Link to="/mirofish" className="flex items-center">
                Access The Society 
                <Globe className="ml-3 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </FadeChild>

      {/* 2. THE ECOSYSTEM: SIMULATION MAP & WORKFORCE */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 px-4">
        <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Node Map</h4>
              <div className="h-px flex-1 bg-slate-100/60" />
            </div>
            <FadeChild>
              <SimulationStatus />
            </FadeChild>
        </div>

        <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Direct Contacts</h4>
              <div className="h-px flex-1 bg-slate-100/60" />
            </div>
            <FadeChild>
              <ActiveAgentCards />
            </FadeChild>
        </div>
      </div>

      {/* 3. THE PULSE: SENTIENT THOUGHT BUS */}
      <div className="max-w-[1000px] mx-auto space-y-4 px-4">
          <div className="flex items-center justify-center gap-3 mb-2 px-2">
            <div className="h-px flex-1 bg-slate-100/60" />
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Real-time Thought Stream</h4>
            <div className="h-px flex-1 bg-slate-100/60" />
          </div>
          <FadeChild>
             <ThoughtBubbleFeed />
          </FadeChild>
      </div>
    </PageTransition>
  );
}
