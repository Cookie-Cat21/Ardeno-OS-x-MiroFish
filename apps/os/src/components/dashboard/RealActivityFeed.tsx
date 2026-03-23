import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bell, Mail, FileText, Brain, Zap, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RECENT_ACTIVITY } from "@/lib/mock-data";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean | null;
  created_at: string | null;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  email: Mail,
  proposal: FileText,
  intelligence: Brain,
  agent: Zap,
  task: CheckCircle2,
};

export default function RealActivityFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    supabase
      .from("notification_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setNotifications(data);
        } else {
          setUseMock(true);
        }
      });

    const channel = supabase
      .channel("dashboard-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_log" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 5)]);
          setUseMock(false);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notification_log").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  if (useMock) {
    return (
      <div>
        {RECENT_ACTIVITY.slice(0, 5).map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/40 transition-colors ${i !== 0 ? "border-t border-border/30" : ""}`}
          >
            <span className="text-muted-foreground/40 w-16 shrink-0 text-[10px] font-data">{a.time}</span>
            <span className="text-primary/80 shrink-0 text-[11px] font-medium w-24 truncate font-body">{a.agent}</span>
            <span className="text-foreground/50 truncate font-body text-[12px]">{a.action}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {notifications.map((n, i) => {
        const Icon = TYPE_ICONS[n.type] || Bell;
        const timeAgo = n.created_at
          ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
          : "";

        const content = (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => !n.read && markRead(n.id)}
            className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/40 transition-colors cursor-pointer ${i !== 0 ? "border-t border-border/30" : ""} ${!n.read ? "bg-primary/[0.02]" : ""}`}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${!n.read ? "text-primary" : "text-muted-foreground/40"}`} />
            <span className="text-muted-foreground/40 w-16 shrink-0 text-[10px] font-data">{timeAgo}</span>
            <span className="text-foreground/70 truncate font-body text-[12px] flex-1">{n.title}</span>
            {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          </motion.div>
        );

        return n.link ? <Link key={n.id} to={n.link}>{content}</Link> : <div key={n.id}>{content}</div>;
      })}
      {notifications.length === 0 && (
        <div className="px-4 py-8 text-center text-[12px] text-muted-foreground/50 font-body">No activity yet</div>
      )}
    </div>
  );
}
