import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Heart, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientRow {
  id: string;
  name: string;
  health_score: number | null;
  industry: string | null;
  email: string | null;
  last_contact: string | null;
  open_projects: number;
}

function getHealthColor(score: number): string {
  if (score >= 70) return "hsl(142, 70%, 62%)";
  if (score >= 40) return "hsl(25, 95%, 62%)";
  return "hsl(0, 72%, 55%)";
}

function getHealthLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

function getHealthIcon(score: number) {
  if (score >= 70) return ShieldCheck;
  if (score >= 40) return AlertTriangle;
  return AlertTriangle;
}

export default function ClientHealth() {
  const [clients, setClients] = useState<ClientRow[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("id, name, health_score, industry, email").order("health_score", { ascending: true }).limit(8),
      supabase.from("projects").select("client_id, status").neq("status", "Completed"),
      supabase.from("pipeline_deals").select("client_id, last_contact"),
    ]).then(([clientsRes, projectsRes, dealsRes]) => {
      const projectCounts: Record<string, number> = {};
      (projectsRes.data ?? []).forEach(p => {
        if (p.client_id) projectCounts[p.client_id] = (projectCounts[p.client_id] || 0) + 1;
      });

      const lastContacts: Record<string, string> = {};
      (dealsRes.data ?? []).forEach(d => {
        if (d.client_id && d.last_contact) {
          if (!lastContacts[d.client_id] || d.last_contact > lastContacts[d.client_id]) {
            lastContacts[d.client_id] = d.last_contact;
          }
        }
      });

      const enriched = (clientsRes.data ?? []).map(c => ({
        ...c,
        health_score: c.health_score ?? 50,
        last_contact: lastContacts[c.id] || null,
        open_projects: projectCounts[c.id] || 0,
      }));

      setClients(enriched);
    });
  }, []);

  if (clients.length === 0) {
    return (
      <motion.div whileHover={{ scale: 1.01 }} className="glass-card p-6">
        <p className="text-sm text-muted-foreground font-body text-center py-4">No clients yet. Add clients to see health scores.</p>
      </motion.div>
    );
  }

  const avgHealth = Math.round(clients.reduce((s, c) => s + c.health_score, 0) / clients.length);
  const atRisk = clients.filter(c => c.health_score < 50).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(142 70% 62% / 0.08)' }}>
            <Heart className="h-[18px] w-[18px] text-success" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">Avg Health</p>
            <p className="font-display text-2xl font-semibold text-foreground">{avgHealth}<span className="text-sm text-muted-foreground">/100</span></p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(0 72% 55% / 0.08)' }}>
            <AlertTriangle className="h-[18px] w-[18px] text-destructive" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">At Risk</p>
            <p className="font-display text-2xl font-semibold text-foreground">{atRisk}<span className="text-sm text-muted-foreground"> clients</span></p>
          </div>
        </motion.div>
      </div>

      {/* Client list */}
      <motion.div whileHover={{ scale: 1.005 }} className="glass-card overflow-hidden">
        {clients.map((client, i) => {
          const color = getHealthColor(client.health_score);
          const label = getHealthLabel(client.health_score);
          const HealthIcon = getHealthIcon(client.health_score);

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors ${i !== 0 ? "border-t border-border/20" : ""}`}
            >
              {/* Health indicator */}
              <div className="relative shrink-0">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(260 15% 11%)" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 15}
                    initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - client.health_score / 100) }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-data font-semibold text-foreground">{client.health_score}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground font-body truncate">{client.name}</p>
                <p className="text-[10px] text-muted-foreground font-body">{client.industry || "No industry"}</p>
              </div>

              <div className="hidden md:flex items-center gap-1.5">
                <HealthIcon className="h-3 w-3" style={{ color }} />
                <span className="text-[10px] font-data" style={{ color }}>{label}</span>
              </div>

              {client.open_projects > 0 && (
                <span className="text-[10px] font-data text-muted-foreground shrink-0 hidden sm:block">
                  {client.open_projects} project{client.open_projects > 1 ? "s" : ""}
                </span>
              )}

              {client.last_contact && (
                <span className="text-[10px] font-data text-muted-foreground shrink-0 hidden lg:block">
                  {formatDistanceToNow(new Date(client.last_contact), { addSuffix: true })}
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
