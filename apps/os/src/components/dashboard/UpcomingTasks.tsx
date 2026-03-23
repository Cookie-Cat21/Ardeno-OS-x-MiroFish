import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Link } from "react-router-dom";

interface TaskRow {
  id: string;
  title: string;
  priority: string | null;
  due_date: string | null;
  status: string | null;
}

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    supabase
      .from("tasks")
      .select("id, title, priority, due_date, status")
      .neq("status", "Done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setTasks(data);
      });
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="dash-card p-6 flex flex-col items-center justify-center min-h-[200px]">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground font-body">No upcoming tasks</p>
        <Link to="/tasks" className="text-[11px] text-primary/70 hover:text-primary transition-colors font-body mt-2">
          Create your first task →
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-muted-foreground font-body">Upcoming Tasks</p>
        <Link to="/tasks" className="text-[10px] text-primary/60 hover:text-primary transition-colors font-data">
          View all →
        </Link>
      </div>
      <div className="space-y-1">
        {tasks.map((task, i) => {
          const overdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0 group"
            >
              <div className={`h-2 w-2 rounded-full shrink-0 ${
                task.priority === "High" ? "bg-destructive" :
                task.priority === "Medium" ? "bg-warning" : "bg-muted-foreground/30"
              }`} />
              <span className="text-[12px] text-foreground/80 font-body truncate flex-1 group-hover:text-foreground transition-colors">{task.title}</span>
              {task.due_date && (
                <span className={`text-[10px] font-data flex items-center gap-1 shrink-0 ${
                  overdue ? "text-destructive" : "text-muted-foreground/50"
                }`}>
                  {overdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                  {isToday(new Date(task.due_date)) ? "Today" : format(new Date(task.due_date), "MMM d")}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
