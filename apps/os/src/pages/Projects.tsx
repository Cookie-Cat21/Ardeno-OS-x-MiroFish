import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Bot, FileText, BarChart3, ArrowLeft, Plus, Search, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";

const STATUS_COLORS: Record<string, string> = {
  Discovery: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Design: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Development: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Review: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface Project {
  id: string;
  client_name: string;
  project_type: string | null;
  brief: string | null;
  status: string | null;
  deadline: string | null;
  value: number | null;
  hours_logged: number | null;
  created_at: string | null;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ client_name: "", project_type: "Website Design", brief: "", status: "Discovery", deadline: "", value: "" });
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (data) setProjects(data);
    setLoading(false);
  };

  const create = async () => {
    if (!form.client_name.trim()) return;
    const { error } = await supabase.from("projects").insert({
      client_name: form.client_name,
      project_type: form.project_type,
      brief: form.brief || null,
      status: form.status,
      deadline: form.deadline || null,
      value: form.value ? Number(form.value) : null,
    });
    if (error) { toast.error("Failed to create project"); return; }
    toast.success("Project created");
    setForm({ client_name: "", project_type: "Website Design", brief: "", status: "Discovery", deadline: "", value: "" });
    setDialogOpen(false);
    load();
  };

  const filtered = projects.filter(
    (p) => p.client_name.toLowerCase().includes(search.toLowerCase()) || (p.project_type || "").toLowerCase().includes(search.toLowerCase())
  );

  if (selectedProject) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="page-shell page-atmosphere max-w-4xl space-y-6">
        <button onClick={() => setSelectedProject(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground">{selectedProject.client_name}</h1>
            <span className={`text-xs border px-2.5 py-1 rounded-lg ${STATUS_COLORS[selectedProject.status || "Discovery"] || "bg-muted text-muted-foreground"}`}>
              {selectedProject.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{selectedProject.project_type}</p>
        </div>

        {selectedProject.brief && (
          <div className="glass-card rounded-xl p-5">
            <div className="text-xs text-muted-foreground font-medium mb-2">Brief</div>
            <p className="text-sm text-foreground/80 leading-relaxed">{selectedProject.brief}</p>
          </div>
        )}

        {selectedProject.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> Deadline: {new Date(selectedProject.deadline).toLocaleDateString()}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Bot, label: "Ask Agent", onClick: () => navigate("/chat") },
            { icon: FileText, label: "Create Proposal", onClick: () => navigate("/proposals") },
            { icon: BarChart3, label: "View Analytics", onClick: () => navigate("/analytics") },
          ].map((a) => (
            <div key={a.label} onClick={a.onClick} className="glass-card rounded-xl p-4 text-center group cursor-pointer">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <a.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{a.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-[1440px] space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <div className="section-label mb-0">Projects</div>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} client projects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg">
              <Plus className="h-4 w-4 mr-1.5" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Website Design", "Web Application", "Branding", "SEO & Marketing", "E-Commerce", "Mobile App", "Consulting"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Brief" value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Discovery", "Design", "Development", "Review", "Delivered"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Value ($)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <Input placeholder="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              <Button onClick={create} className="w-full rounded-lg">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={fadeUp} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary/50 border-border/50 pl-10 rounded-lg backdrop-blur-sm" />
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-2">
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <ArdenoEmptyState
            icon={FileText}
            title="No projects yet"
            description="Create your first active delivery surface so Ardeno OS can track milestones, value, deadlines, and downstream execution."
          />
        ) : (
          filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="glass-card rounded-xl p-4 cursor-pointer flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-foreground">{project.client_name}</span>
                  <span className={`text-[10px] border px-2 py-0.5 rounded-md ${STATUS_COLORS[project.status || "Discovery"] || "bg-muted text-muted-foreground"}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{project.project_type} · {project.brief}</p>
              </div>
              {project.value && <span className="text-xs font-data text-primary shrink-0 hidden md:block">${project.value.toLocaleString()}</span>}
              <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : "—"}
              </span>
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
