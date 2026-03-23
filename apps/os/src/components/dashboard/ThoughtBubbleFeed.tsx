import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

interface Thought {
  id: string;
  agentName: string;
  content: string;
  type: "thinking" | "acting" | "result";
  timestamp: Date;
}

const mockThoughts: Thought[] = [
  { id: "1", agentName: "Strategy One", content: "Analyzing market gaps in the Sri Lankan tech sector...", type: "thinking", timestamp: new Date() },
  { id: "2", agentName: "Lead Gen Bot", content: "Identifying high-intent targets in Colombo region", type: "acting", timestamp: new Date() },
  { id: "3", agentName: "Creative Director", content: "Designing minimalist glass interfaces for Ardeno OS", type: "acting", timestamp: new Date() },
];

const MIROFISH_API = "http://localhost:5001"; // Default to local for bridging

export default function ThoughtBubbleFeed() {
  const [thoughts, setThoughts] = useState<Thought[]>(mockThoughts);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Initialize: Find latest simulation
  useEffect(() => {
    const fetchLatestSim = async () => {
      try {
        const res = await fetch(`${MIROFISH_API}/api/simulation/list`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          // Sort by date and take latest
          const latest = json.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          setActiveSimId(latest.simulation_id);
        }
      } catch (e) {
        console.error("MiroFish Backend Standby (Simulation List):", e);
      }
    };
    fetchLatestSim();
  }, []);

  // Poll for actions
  useEffect(() => {
    if (!activeSimId) return;

    const pollActions = async () => {
      try {
        const res = await fetch(`${MIROFISH_API}/api/simulation/${activeSimId}/run-status/detail`);
        const json = await res.json();
        
        if (json.success && json.data.recent_actions && json.data.recent_actions.length > 0) {
          const newThoughts: Thought[] = json.data.recent_actions.map((act: any) => ({
            id: act.timestamp + act.agent_id,
            agentName: act.agent_name,
            content: `${act.action_type}: ${JSON.stringify(act.action_args || {})}`.slice(0, 100) + "...",
            type: act.action_type.includes("POST") ? "acting" : "thinking",
            timestamp: new Date(act.timestamp)
          }));
          
          setThoughts(newThoughts.slice(0, 5));
          setIsLive(true);
        } else {
          setIsLive(false);
        }
      } catch (e) {
        console.error("Sentient Stream Sync Error:", e);
        setIsLive(false);
      }
    };

    const interval = setInterval(pollActions, 3000);
    pollActions(); // Initial burst
    return () => clearInterval(interval);
  }, [activeSimId]);

  // Fallback simulation (Keep visual pulse if backend is idle)
  useEffect(() => {
    if (isLive) return; 

    const interval = setInterval(() => {
      const newThought: Thought = {
        id: Math.random().toString(),
        agentName: "Parallel Logic",
        content: "Idling simulation step #" + Math.floor(Math.random() * 1000) + " - Waiting for live stream...",
        type: "thinking",
        timestamp: new Date(),
      };
      setThoughts(prev => [newThought, ...prev.slice(0, 4)]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="arden-card h-full min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm border border-blue-100/50">
            <MessageSquare size={18} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sentient Stream</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors ${
          isLive 
            ? "bg-green-50 border-green-100 text-green-600" 
            : "bg-amber-50 border-amber-100 text-amber-600"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
          {isLive ? "Live Stream" : "Simulation Standby"}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-hidden relative">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />
        <AnimatePresence initial={false}>
          {thoughts.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none">
                  {thought.agentName}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">•</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {thought.type}
                </span>
              </div>
              <p className="text-[13.5px] text-slate-700 leading-relaxed font-medium">
                {thought.content}
              </p>
              
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={14} className="text-blue-300" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center">
        <button className="text-[11px] font-bold text-blue-500/70 hover:text-blue-500 transition-colors uppercase tracking-widest">
          View Full History
        </button>
      </div>
    </div>
  );
}
