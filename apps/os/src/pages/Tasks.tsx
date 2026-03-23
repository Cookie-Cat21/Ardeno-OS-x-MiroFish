import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, FolderKanban, Bot, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS = ["To Do", "In Progress", "Done"] as const;
type TaskStatus = typeof COLUMNS[number];
const COL_ACCENT: Record<string, string> = {
  "To Do": "from-blue-500/20 to-transparent",
  "In Progress": "from-yellow-500/20 to-transparent",
  Done: "from-emerald-500/20 to-transparent",
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  due_date: string | null;
  project_id: string | null;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "To Do", priority: "Medium", assigned_to: "", due_date: "" });
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const create = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
    });
    if (error) { toast.error("Failed to create task"); return; }
    toast.success("Task created");
    setForm({ title: "", description: "", status: "To Do", priority: "Medium", assigned_to: "", due_date: "" });
    setDialogOpen(false);
    load();
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    setTasks((p) => p.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    toast.success(`Moved to ${newStatus}`);
  };

  if (loading) {
    return <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-[1440px] space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <div className="section-label mb-0">Tasks</div>
          <p className="text-sm text-muted-foreground mt-1">{tasks.length} total</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg">
              <Plus className="h-4 w-4 mr-1.5" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High", "Urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Assigned to" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
                <Input placeholder="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <Button onClick={create} className="w-full rounded-lg">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((column) => {
          const colTasks = tasks.filter((t) => t.status === column);
          return (
            <div key={column} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{column}</span>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{colTasks.length}</span>
              </div>
              <div className={`space-y-2 bg-gradient-to-b ${COL_ACCENT[column]} rounded-xl p-3`}>
                {colTasks.map((task) => (
                  <div key={task.id} className="glass-card rounded-xl p-4 space-y-2.5">
                    <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                    {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {task.assigned_to && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {task.assigned_to}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          task.priority === "Urgent" ? "bg-destructive/10 text-destructive" :
                          task.priority === "High" ? "bg-orange-500/10 text-orange-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{task.priority}</span>
                      )}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      {COLUMNS.filter((c) => c !== task.status).map((s) => (
                        <button key={s} onClick={() => moveTask(task.id, s)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border/50 hover:border-primary/30 hover:bg-primary/5">
                          → {s}
                        </button>
                      ))}
                      <button onClick={() => navigate("/chat")} className="text-[10px] text-primary ml-auto flex items-center gap-1 hover:text-primary/80">
                        <Bot className="h-3 w-3" /> Agent
                      </button>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-10">No tasks</p>}
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
