import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, DollarSign, CheckCircle2, Clock, FileDown, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonMotion, pageVariants, sectionReveal } from "@/lib/motion";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  items: any;
  created_at: string | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ invoice_number: "", amount: "", status: "Draft", due_date: "", notes: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("invoices" as any).select("*").order("created_at", { ascending: false });
    if (data) setInvoices(data as any[]);
    setLoading(false);
  };

  const create = async () => {
    if (!form.amount) return;
    const num = form.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from("invoices" as any).insert({
      invoice_number: num,
      amount: Number(form.amount),
      status: form.status,
      due_date: form.due_date || null,
      notes: form.notes || null,
      items: [{ description: "Service", amount: Number(form.amount) }],
    } as any);
    toast.success("Invoice created");
    setDialogOpen(false);
    setForm({ invoice_number: "", amount: "", status: "Draft", due_date: "", notes: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "Paid") update.paid_at = new Date().toISOString();
    await supabase.from("invoices" as any).update(update).eq("id", id);
    toast.success(`Marked as ${status}`);
    load();
  };

  const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
  const pending = invoices.filter((i) => i.status === "Sent").reduce((s, i) => s + (i.amount || 0), 0);
  const overdue = invoices.filter((i) => i.status === "Sent" && i.due_date && new Date(i.due_date) < new Date()).length;

  const statusColor = (s: string) => {
    if (s === "Paid") return "text-emerald-400 bg-emerald-500/10";
    if (s === "Sent") return "text-yellow-400 bg-yellow-500/10";
    if (s === "Overdue") return "text-destructive bg-destructive/10";
    return "text-muted-foreground bg-muted";
  };

  return (
    <motion.div initial="hidden" animate="show" variants={pageVariants} className="page-shell page-atmosphere max-w-6xl space-y-6">
      <motion.div variants={sectionReveal} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label mb-1">Invoices</div>
          <p className="text-sm text-muted-foreground">Auto-generated from won proposals · Track payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" /> New Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Invoice # (auto-generated)" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
              <Input placeholder="Amount ($)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Input placeholder="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={create} className="w-full rounded-lg">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={sectionReveal} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Invoiced", value: `$${total.toLocaleString()}`, color: "text-foreground" },
          { label: "Paid", value: `$${paid.toLocaleString()}`, color: "text-emerald-400" },
          { label: "Pending", value: `$${pending.toLocaleString()}`, color: "text-yellow-400" },
          { label: "Overdue", value: overdue, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={sectionReveal} className="space-y-2">
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
        ) : invoices.length === 0 ? (
          <ArdenoEmptyState
            icon={DollarSign}
            title="No invoices yet"
            description="Invoices appear here as deals mature into real revenue. Mark proposals won or create one manually to activate billing."
          />
        ) : (
          invoices.map((inv) => {
            const isOverdue = inv.status === "Sent" && inv.due_date && new Date(inv.due_date) < new Date();
            const displayStatus = isOverdue ? "Overdue" : (inv.status || "Draft");
            return (
              <div key={inv.id} className="glass-card rounded-xl p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground font-data">{inv.invoice_number}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${statusColor(displayStatus)}`}>{displayStatus}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {inv.due_date && <span className="text-[10px] text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</span>}
                    {inv.notes && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{inv.notes}</span>}
                  </div>
                </div>
                <span className="font-display text-xl text-foreground">${inv.amount.toLocaleString()}</span>
                <div className="flex gap-1">
                  {inv.status === "Draft" && (
                    <motion.button {...buttonMotion} onClick={() => updateStatus(inv.id, "Sent")} className="glass-card px-2 py-1 rounded-lg text-[10px] text-primary hover:bg-primary/10 transition-all flex items-center gap-1">
                      <Send className="h-3 w-3" /> Send
                    </motion.button>
                  )}
                  {(inv.status === "Sent" || isOverdue) && (
                    <motion.button {...buttonMotion} onClick={() => updateStatus(inv.id, "Paid")} className="glass-card px-2 py-1 rounded-lg text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Paid
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
