import { motion } from "framer-motion";
import { Globe, Users, Zap, Search, MessageSquare, Brain } from "lucide-react";
import SimulationStatus from "./dashboard/SimulationStatus";
import ThoughtBubbleFeed from "./dashboard/ThoughtBubbleFeed";

export default function ParallelSociety() {
  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-20">
      {/* 1. HEADER: ECOSYSTEM HUD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500/70">
            <Globe size={14} />
            Ecosystem Overview
          </div>
          <h1 className="font-display text-[clamp(2.5rem,4vw,3.5rem)] font-bold leading-none tracking-[-0.04em] text-slate-900">
            Parallel Society
          </h1>
          <p className="max-w-[500px] text-base font-medium text-slate-500 leading-relaxed">
            Monitor the 512 autonomous agents simulated across 9 specialized departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="arden-card !p-3 !py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</div>
              <div className="text-[13px] font-bold text-green-500 mt-0.5">Simulation Active</div>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. THE GRID: DEPARTMENT CLUSTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 px-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 font-data">Department Nodes</h4>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <SimulationStatus />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            <div className="arden-card space-y-4">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100/50">
                    <Zap size={20} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Society Pulse</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                    The current simulation temperature is **1.2x**. Agents are processing high-stakes market forecasting and lead generation.
                </p>
                <div className="pt-2">
                    <button className="text-[11px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors">
                        Tune Temperature →
                    </button>
                </div>
            </div>

            <div className="arden-card space-y-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 border border-purple-100/50">
                    <Brain size={20} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Neural Sync</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                    Departments are achieving **98%** cross-sync. Intelligence is actively feeding Marketing and Strategy pipelines.
                </p>
                <div className="pt-2">
                    <button className="text-[11px] font-bold text-purple-500 uppercase tracking-widest hover:text-purple-600 transition-colors">
                        View Sync Logs →
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* 3. ASIDE: GLOBAL THOUGHT STREAM */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 font-data">Live Thought Bus</h4>
              <div className="h-px flex-1 bg-slate-100" />
           </div>
           <ThoughtBubbleFeed />
        </div>
      </div>
    </div>
  );
}
