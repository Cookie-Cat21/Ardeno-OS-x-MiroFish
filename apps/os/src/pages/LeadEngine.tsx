import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Globe, Mail, BarChart3, ExternalLink, Loader2, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { buttonMotion, pageVariants, sectionReveal } from "@/lib/motion";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Responded: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Converted: "bg-primary/10 text-primary border-primary/20",
  Dead: "bg-muted text-muted-foreground border-border/30",
};

interface Lead {
  id: string;
  name: string | null;
  url: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  status: string | null;
  score: number | null;
  notes: string | null;
  created_at: string | null;
}

export default function LeadEngine() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scoring, setScoring] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", url: "", industry: "", city: "", country: "", status: "New", score: "", notes: "" });
  const [genForm, setGenForm] = useState({ industry: "", location: "", companySize: "10-50", budgetRange: "$10k-50k" });
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  const create = async () => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      url: form.url || null,
      industry: form.industry || null,
      city: form.city || null,
      country: form.country || null,
      status: form.status,
      score: form.score ? Number(form.score) : null,
      notes: form.notes || null,
    });
    if (error) { toast.error("Failed to add lead"); return; }
    toast.success("Lead added");
    setForm({ name: "", url: "", industry: "", city: "", country: "", status: "New", score: "", notes: "" });
    setDialogOpen(false);
    load();
  };

  const generateLeads = async () => {
    if (!genForm.industry || !genForm.location) {
      toast.error("Please fill in industry and location");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("lead-generator", {
        body: { action: "generate", criteria: genForm }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`🎯 Generated ${data.count} new leads!`);
        setGeneratorOpen(false);
        setGenForm({ industry: "", location: "", companySize: "10-50", budgetRange: "$10k-50k" });
        load();
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error) {
      console.error("Lead generation error:", error);
      toast.error("❌ Failed to generate leads. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const scoreLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setScoring(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("lead-generator", {
        body: { 
          action: "score", 
          criteria: { 
            leadId, 
            leadData: lead 
          } 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`✨ Lead scored: ${data.score}/10`);
        load(); // Reload to get updated score
      } else {
        throw new Error(data.error || "Scoring failed");
      }
    } catch (error) {
      console.error("Lead scoring error:", error);
      toast.error("❌ Failed to score lead");
    } finally {
      setScoring(null);
    }
  };

  const filtered = leads.filter(
    (l) =>
      (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.industry || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial="hidden" animate="show" variants={pageVariants} className="page-shell page-atmosphere max-w-[1440px] space-y-6">
      <motion.div variants={sectionReveal} className="flex items-center justify-between">
        <div>
          <div className="section-label mb-0">Lead Engine</div>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} leads tracked • AI-powered prospecting</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pipeline">
            <Button variant="outline" size="sm" className="rounded-lg border-border/50">
              <BarChart3 className="h-4 w-4 mr-1.5" /> Pipeline
            </Button>
          </Link>
          <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4 mr-1.5" /> Generate Leads
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>🎯 AI Lead Generator</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input 
                  placeholder="Target industry (e.g., SaaS, E-commerce)" 
                  value={genForm.industry} 
                  onChange={(e) => setGenForm({ ...genForm, industry: e.target.value })} 
                />
                <Input 
                  placeholder="Location (e.g., San Francisco, CA)" 
                  value={genForm.location} 
                  onChange={(e) => setGenForm({ ...genForm, location: e.target.value })} 
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={genForm.companySize} onValueChange={(v) => setGenForm({ ...genForm, companySize: v })}>
                    <SelectTrigger><SelectValue placeholder="Company Size" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="10-50">10-50 employees</SelectItem>
                      <SelectItem value="50-200">50-200 employees</SelectItem>
                      <SelectItem value="200+">200+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={genForm.budgetRange} onValueChange={(v) => setGenForm({ ...genForm, budgetRange: v })}>
                    <SelectTrigger><SelectValue placeholder="Budget Range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$5k-25k">$5k - $25k</SelectItem>
                      <SelectItem value="$25k-100k">$25k - $100k</SelectItem>
                      <SelectItem value="$100k+">$100k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateLeads} disabled={generating} className="w-full rounded-lg">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Leads...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Generate 10 Leads
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg border-border/50">
                <Plus className="h-4 w-4 mr-1.5" /> Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Website URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                  <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  <Input placeholder="Score (1-10)" type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
                </div>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["New", "Contacted", "Responded", "Qualified", "Converted", "Dead"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <Button onClick={create} className="w-full rounded-lg">Add Lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={sectionReveal} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary/50 border-border/50 pl-10 rounded-lg backdrop-blur-sm" />
      </motion.div>

      {/* Leads list */}
      <motion.div variants={sectionReveal} className="space-y-2">
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <ArdenoEmptyState
            icon={Target}
            title="No leads yet"
            description="Seed the lead engine manually or let Ardeno generate prospects so scoring, outreach, and pipeline intelligence can activate."
          />
        ) : (
          filtered.map((lead) => (
            <div key={lead.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-foreground">{lead.name}</span>
                  <span className={`text-[10px] border px-2 py-0.5 rounded-md ${STATUS_COLORS[lead.status || "New"] || "bg-muted text-muted-foreground"}`}>
                    {lead.status}
                  </span>
                  {lead.score && (
                    <span className={`text-[10px] font-data px-2 py-0.5 rounded-md ${
                      lead.score >= 7 ? "bg-emerald-500/10 text-emerald-400" : lead.score >= 4 ? "bg-yellow-500/10 text-yellow-400" : "bg-muted text-muted-foreground"
                    }`}>
                      Score: {lead.score}/10
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lead.industry} · {lead.city}{lead.country ? `, ${lead.country}` : ""}
                  {lead.notes && <span className="ml-2">— {lead.notes}</span>}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <motion.button {...buttonMotion}
                  onClick={() => scoreLead(lead.id)} 
                  disabled={scoring === lead.id}
                  className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all disabled:opacity-50" 
                  title="AI Score Lead"
                >
                  {scoring === lead.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </motion.button>
                <motion.button {...buttonMotion} onClick={() => navigate(`/analyzer${lead.url ? `?url=${encodeURIComponent(lead.url)}` : ""}`)} className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all" title="Analyze Website">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                </motion.button>
                <motion.button {...buttonMotion} onClick={() => navigate("/outreach")} className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all" title="Draft Outreach">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                </motion.button>
                {lead.url && (
                  <motion.a {...buttonMotion} href={lead.url.startsWith("http") ? lead.url : `https://${lead.url}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all" title="Visit Website">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.a>
                )}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
