import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;

const STATUS_STEPS = ["Discovery", "Design", "Development", "Review", "Delivered"];

export default function ProjectStatus() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    loadProject();
  }, [token]);

  const loadProject = async () => {
    const { data } = await supabase.from("projects").select("*").eq("share_token", token).single();
    if (!data) { setNotFound(true); } else { setProject(data); }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="glass-card rounded-2xl p-12 text-center max-w-md">
          <h2 className="text-xl font-display text-foreground mb-2">Project Not Found</h2>
          <p className="text-sm text-muted-foreground">This link may be expired or invalid.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(project.status || "Discovery");
  const updates = Array.isArray(project.public_updates) ? project.public_updates : [];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div variants={fadeUp} className="text-center">
          <p className="text-xs text-primary font-medium mb-2">PROJECT STATUS</p>
          <h1 className="text-3xl font-display text-foreground">{project.client_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.project_type || "Web Project"}</p>
        </motion.div>

        {/* Progress steps */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                    i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i < currentIdx ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-medium">{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] mt-2 font-medium ${i <= currentIdx ? "text-primary" : "text-muted-foreground"}`}>{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Project details */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-1">Current Phase</p>
            <p className="text-lg font-display text-primary">{project.status || "Discovery"}</p>
          </div>
          {project.deadline && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">Target Deadline</p>
              <p className="text-lg font-display text-foreground">{new Date(project.deadline).toLocaleDateString()}</p>
            </div>
          )}
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-1">Hours Logged</p>
            <p className="text-lg font-display text-foreground">{project.hours_logged || 0}h</p>
          </div>
        </motion.div>

        {/* Updates */}
        {updates.length > 0 && (
          <motion.div variants={fadeUp}>
            <h2 className="section-label mb-4">Updates</h2>
            <div className="space-y-3">
              {updates.map((u: any, i: number) => (
                <div key={i} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{u.date}</span>
                  </div>
                  <p className="text-sm text-foreground">{u.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="text-center">
          <p className="text-[10px] text-muted-foreground">Powered by Ardeno OS</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
