import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, DollarSign, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonMotion, pageVariants, sectionReveal } from "@/lib/motion";

interface Proposal {
  id: string;
  title: string;
  industry: string | null;
  value: number | null;
  pages: number | null;
  features: string[] | null;
  status: string | null;
  result: string | null;
  notes: string | null;
  created_at: string | null;
}

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", industry: "", value: "", pages: "5", features: "", status: "Draft", result: "Pending", notes: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("proposals" as any).select("*").order("created_at", { ascending: false });
    if (data) setProposals(data as any[]);
    setLoading(false);
  };

  const create = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from("proposals" as any).insert({
      title: form.title,
      industry: form.industry || null,
      value: form.value ? Number(form.value) : null,
      pages: form.pages ? Number(form.pages) : null,
      features: form.features ? form.features.split(",").map((f: string) => f.trim()) : [],
      status: form.status,
      result: form.result,
      notes: form.notes || null,
    } as any);
    if (error) { toast.error("Failed to create"); return; }
    toast.success("Proposal created");
    setForm({ title: "", industry: "", value: "", pages: "5", features: "", status: "Draft", result: "Pending", notes: "" });
    setDialogOpen(false);
    load();
  };

  const updateResult = async (id: string, result: string) => {
    await supabase.from("proposals" as any).update({ result } as any).eq("id", id);
    toast.success(`Marked as ${result}`);
    load();
  };

  const resultIcon = (r: string) => {
    if (r === "Won") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    if (r === "Lost") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-yellow-400" />;
  };

  const stats = {
    total: proposals.length,
    won: proposals.filter((p) => p.result === "Won").length,
    lost: proposals.filter((p) => p.result === "Lost").length,
    pending: proposals.filter((p) => p.result === "Pending").length,
    totalValue: proposals.filter((p) => p.result === "Won").reduce((s, p) => s + (p.value || 0), 0),
  };

  return (
    <motion.div initial="hidden" animate="show" variants={pageVariants} className="page-shell page-atmosphere max-w-6xl space-y-6">
      <motion.div variants={sectionReveal} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label mb-1">Proposals</div>
          <p className="text-sm text-muted-foreground">Track proposals, win rates, and pricing patterns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" /> New Proposal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Proposal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                <Input placeholder="Value ($)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Pages" type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Viewed">Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Features (comma-separated)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={create} className="w-full rounded-lg">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div variants={sectionReveal} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Won", value: stats.won, color: "text-emerald-400" },
          { label: "Lost", value: stats.lost, color: "text-destructive" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Revenue Won", value: `$${stats.totalValue.toLocaleString()}`, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Proposals list */}
      <motion.div variants={sectionReveal} className="space-y-2">
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
        ) : proposals.length === 0 ? (
          <ArdenoEmptyState
            icon={FileText}
            title="No proposals yet"
            description="Create your first proposal to start tracking pricing, outcomes, and win-rate patterns inside Ardeno OS."
          />
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="glass-card rounded-xl p-4 flex items-center gap-4 flex-wrap">
              {resultIcon(p.result || "Pending")}
              <div className="flex-1 min-w-[150px]">
                <h4 className="text-sm font-medium text-foreground">{p.title}</h4>
                <div className="flex gap-3 mt-0.5">
                  {p.industry && <span className="text-[10px] text-primary">{p.industry}</span>}
                  {p.pages && <span className="text-[10px] text-muted-foreground">{p.pages} pages</span>}
                  <span className="text-[10px] text-muted-foreground">{p.status}</span>
                </div>
              </div>
              {p.value && (
                <span className="font-display text-lg text-foreground">${p.value.toLocaleString()}</span>
              )}
              <div className="flex gap-1">
                {p.result === "Pending" && (
                  <>
                    <motion.button {...buttonMotion} onClick={() => updateResult(p.id, "Won")} className="glass-card px-2 py-1 rounded-lg text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-all">Won</motion.button>
                    <motion.button {...buttonMotion} onClick={() => updateResult(p.id, "Lost")} className="glass-card px-2 py-1 rounded-lg text-[10px] text-destructive hover:bg-destructive/10 transition-all">Lost</motion.button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
