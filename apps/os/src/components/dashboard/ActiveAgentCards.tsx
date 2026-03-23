import { AGENTS } from "@/lib/agents";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Cpu } from "lucide-react";

export default function ActiveAgentCards() {
  const navigate = useNavigate();
  const activeAgents = AGENTS.filter((a) => a.enabled);
  const displayAgents = activeAgents.slice(0, 6);

  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-muted-foreground font-body">Active AI Agents</p>
        <span className="text-[10px] font-data px-2 py-0.5 rounded-md bg-success/10 text-success">
          {activeAgents.length} online
        </span>
      </div>

      <div className="space-y-2">
        {displayAgents.map((agent, i) => (
          <motion.button
            key={agent.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate("/chat")}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-all duration-200 group text-left"
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/8 group-hover:bg-primary/12 transition-colors shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-foreground font-body truncate">{agent.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="relative">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-success status-active" />
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-data truncate">{agent.model}</span>
              </div>
            </div>
            <Cpu className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      {activeAgents.length > 6 && (
        <button
          onClick={() => navigate("/chat")}
          className="w-full mt-3 text-[11px] text-primary/70 hover:text-primary transition-colors font-body py-1.5"
        >
          View all {activeAgents.length} agents →
        </button>
      )}
    </div>
  );
}
