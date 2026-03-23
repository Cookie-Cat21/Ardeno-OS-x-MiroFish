import { useState, useEffect, useCallback } from "react";
import { Bell, X, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { buttonMotion, dropdownVariants, overlayVariants } from "@/lib/motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  link: string | null;
  created_at: string | null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notification_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as any[]);
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("notification_log" as any).update({ read: true } as any).eq("id", id);
    load();
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from("notification_log" as any).update({ read: true } as any).eq("id", id);
    }
    load();
  };

  useEffect(() => {
    if (unread > 0 && "Notification" in window && Notification.permission === "granted") {
      const latest = notifications.find((n) => !n.read);
      if (latest) {
        new Notification(latest.title, { body: latest.message || "", icon: "/favicon.ico" });
      }
    }
  }, [unread]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      <motion.button
        {...buttonMotion}
        onClick={() => setOpen(!open)}
        className="shell-icon-button relative h-10 w-10"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40" variants={overlayVariants} initial="hidden" animate="show" exit="exit" onClick={() => setOpen(false)} />
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-h-[420px] overflow-y-auto ardeno-panel cinematic-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/20 p-3.5">
                <div>
                  <span className="font-data text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Notifications</span>
                  <p className="mt-1 text-[13px] font-medium text-foreground">Operational updates</p>
                </div>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-body">Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-[14px] border border-white/10 bg-white/[0.03]" />
                  <p className="text-[13px] font-medium text-foreground">No notifications yet</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Ardeno OS will surface automations, alerts, and workflow events here.</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex gap-3 border-b border-border/10 px-3.5 py-3 transition-colors duration-100 ${!n.read ? "bg-primary/[0.035]" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground font-body">{n.title}</p>
                      {n.message && <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground font-body">{n.message}</p>}
                      <p className="mt-1 font-data text-[10px] text-muted-foreground/40">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="shell-icon-button h-7 w-7 rounded-[10px]"><Check className="h-3 w-3 text-muted-foreground" /></button>
                      )}
                      {n.link && (
                        <Link to={n.link} onClick={() => { markRead(n.id); setOpen(false); }} className="shell-icon-button h-7 w-7 rounded-[10px]">
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RunAutomationsButton() {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    toast.info("Running automations...");
    try {
      const { data, error } = await supabase.functions.invoke("run-automations");
      console.log("run-automations response:", { data, error });
      if (error) {
        toast.error("Automation failed: " + (error.message || "Unknown error"));
        return;
      }
      if (data?.notifications_created > 0) {
        toast.success(`${data.notifications_created} new notifications generated`);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Automations Complete", { body: `${data.notifications_created} new notifications generated.` });
        }
      } else {
        toast.info("No new notifications — everything looks good!");
      }
    } catch (e) {
      console.error("run-automations error:", e);
      toast.error("Failed to run automations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      {...buttonMotion}
      onClick={run}
      disabled={loading}
      className="shell-icon-button h-10 w-10"
      title="Run automations"
    >
      {loading ? (
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
      )}
    </motion.button>
  );
}
