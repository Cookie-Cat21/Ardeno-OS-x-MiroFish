import { AGENTS } from "@/lib/agents";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Cpu, Sparkles } from "lucide-react";

export default function ActiveAgentCards() {
  const navigate = useNavigate();
  const activeAgents = AGENTS.filter((a) => a.enabled);
  const displayAgents = activeAgents.slice(0, 5);

  return (
    <div className="arden-card !p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Active Workforce</h3>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-500 border border-blue-100/50">
          {activeAgents.length} Online
        </span>
      </div>

      <div className="space-y-3">
        {displayAgents.map((agent, i) => (
          <motion.button
            key={agent.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate("/chat")}
            className="w-full flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all group text-left"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500 group-hover:scale-105 transition-transform shrink-0">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-slate-800 truncate">{agent.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider">{agent.department}</span>
              </div>
            </div>
            <div className="flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </motion.button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <button
          onClick={() => navigate("/chat")}
          className="w-full flex items-center justify-between px-3 text-[11px] font-bold text-blue-500/70 hover:text-blue-500 transition-colors uppercase tracking-widest"
        >
          View Full Roster
          <Sparkles size={12} />
        </button>
      </div>
    </div>
  );
}
