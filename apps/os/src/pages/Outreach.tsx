import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Mail, CheckCircle2, Calendar, MessageSquare, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;

interface OutreachLog {
  id: string;
  method: string | null;
  subject: string | null;
  template: string | null;
  body_preview: string | null;
  sent_at: string | null;
  opened: boolean;
  replied: boolean;
  meeting_booked: boolean;
  converted: boolean;
  notes: string | null;
  lead_id: string | null;
  created_at: string | null;
}

export default function Outreach() {
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ method: "email", subject: "", template: "", body_preview: "", notes: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("outreach_logs" as any).select("*").order("created_at", { ascending: false });
    if (data) setLogs(data as any[]);
    setLoading(false);
  };

  const create = async () => {
    if (!form.subject.trim()) return;
    const { error } = await supabase.from("outreach_logs" as any).insert({
      method: form.method,
      subject: form.subject,
      template: form.template || null,
      body_preview: form.body_preview || null,
      notes: form.notes || null,
    } as any);
    if (error) { toast.error("Failed to log"); return; }
    toast.success("Outreach logged");
    setForm({ method: "email", subject: "", template: "", body_preview: "", notes: "" });
    setDialogOpen(false);
    load();
  };

  const toggleField = async (id: string, field: string, current: boolean) => {
    await supabase.from("outreach_logs" as any).update({ [field]: !current } as any).eq("id", id);
    load();
  };

  const total = logs.length;
  const replied = logs.filter((l) => l.replied).length;
  const meetings = logs.filter((l) => l.meeting_booked).length;
  const converted = logs.filter((l) => l.converted).length;
  const replyRate = total ? Math.round((replied / total) * 100) : 0;
  const meetingRate = total ? Math.round((meetings / total) * 100) : 0;
  const conversionRate = total ? Math.round((converted / total) * 100) : 0;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 pb-24 md:pb-10">
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label mb-1">Outreach Tracker</div>
          <p className="text-sm text-muted-foreground">Log outreach attempts, track replies, meetings, and conversions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" /> Log Outreach</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Outreach</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="demo_concept">Demo Concept</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Subject / Topic" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <Input placeholder="Template name (optional)" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} />
              <Textarea placeholder="Body preview (optional)" value={form.body_preview} onChange={(e) => setForm({ ...form, body_preview: e.target.value })} className="min-h-[80px]" />
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={create} className="w-full rounded-lg">Log</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: total, sub: "", color: "text-foreground" },
          { label: "Reply Rate", value: `${replyRate}%`, sub: `${replied} replies`, color: "text-primary" },
          { label: "Meeting Rate", value: `${meetingRate}%`, sub: `${meetings} meetings`, color: "text-yellow-400" },
          { label: "Conversion Rate", value: `${conversionRate}%`, sub: `${converted} converted`, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            {s.sub && <p className="text-[10px] text-muted-foreground/60">{s.sub}</p>}
          </div>
        ))}
      </motion.div>

      {/* Outreach list */}
      <motion.div variants={fadeUp} className="space-y-2">
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
        ) : logs.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Mail className="h-10 w-10 text-primary/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">No outreach logged yet — start tracking to build your dataset</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="glass-card rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <h4 className="text-sm font-medium text-foreground">{log.subject || "Untitled"}</h4>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-primary">{log.method}</span>
                  {log.template && <span className="text-[10px] text-muted-foreground">Template: {log.template}</span>}
                  <span className="text-[10px] text-muted-foreground">{log.sent_at ? new Date(log.sent_at).toLocaleDateString() : ""}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {[
                  { field: "replied", label: "Replied", val: log.replied, icon: MessageSquare },
                  { field: "meeting_booked", label: "Meeting", val: log.meeting_booked, icon: Calendar },
                  { field: "converted", label: "Converted", val: log.converted, icon: Users },
                ].map((t) => (
                  <button
                    key={t.field}
                    onClick={() => toggleField(log.id, t.field, t.val)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] transition-all ${
                      t.val ? "bg-emerald-500/10 text-emerald-400" : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.val ? <CheckCircle2 className="h-3 w-3" /> : <t.icon className="h-3 w-3" />}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
