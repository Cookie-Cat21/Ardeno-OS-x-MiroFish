import { motion } from "framer-motion";
import { Globe, Users, Zap, Search } from "lucide-react";

const departments = [
  { id: 1, name: "Intelligence", agents: 42, active: true },
  { id: 2, name: "Marketing", agents: 68, active: true },
  { id: 3, name: "Development", agents: 125, active: false },
  { id: 4, name: "Sales", agents: 35, active: true },
  { id: 5, name: "Support", agents: 50, active: false },
  { id: 6, name: "Operations", agents: 80, active: true },
  { id: 7, name: "Creative", agents: 45, active: true },
  { id: 8, name: "Legal", agents: 12, active: false },
  { id: 9, name: "Strategy", agents: 25, active: true },
];

export default function SimulationStatus() {
  return (
    <div className="arden-card relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Globe size={120} className="miro-pulse" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-none">Parallel Society</h3>
            <p className="text-[13px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Simulation Active – 512 Agents Syncing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {i === 3 ? "+300" : ""}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <motion.div 
              key={dept.id}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-2xl border transition-all ${
                dept.active 
                  ? "bg-blue-50/50 border-blue-100/50" 
                  : "bg-slate-50/50 border-slate-100/50 grayscale opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${dept.active ? "text-blue-500" : "text-slate-400"}`}>
                  {dept.name}
                </span>
                {dept.active && <Zap size={12} className="text-blue-500 animate-pulse" />}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-display font-bold text-slate-900">{dept.agents}</div>
                <div className="text-[11px] font-bold text-slate-400 mb-1">Agents</div>
              </div>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: dept.active ? "70%" : "20%" }}
                  className={`h-full ${dept.active ? "bg-blue-500" : "bg-slate-300"}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
