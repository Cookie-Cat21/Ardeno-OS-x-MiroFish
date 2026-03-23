import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AGENT_CATALOG,
  DEPT_META,
  CATALOG_DEPT_ORDER,
  getCatalogByDept,
  type CatalogAgent,
  type AgentDept,
  type AgentProvider,
} from "@/lib/agents";
import AgentsOverviewPage from "./AgentsOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArdenoMark } from "@/components/brand/ArdenoBrand";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Sparkles, Save,
  ShieldCheck, Cpu, ChevronDown, ChevronRight,
} from "lucide-react";

const OPENROUTER_FREE_MODELS = [
  { id: "deepseek/deepseek-r1:free",                    label: "DeepSeek R1 (Reasoning)" },
  { id: "qwen/qwen3-32b:free",                          label: "Qwen3 32B (Coding)" },
  { id: "meta-llama/llama-4-maverick:free",             label: "Llama 4 Maverick (Creative)" },
  { id: "google/gemini-2.5-flash:free",                 label: "Gemini Flash (General)" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free",label: "Mistral Small (Lightweight)" },
];

const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)" },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B (Instant)" },
  { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B (Code)" },
  { id: "gemma2-9b-it",            label: "Gemma2 9B (Lightweight)" },
];

const PROVIDER_CHIP: Record<AgentProvider, { short: string; cls: string }> = {
  openrouter: { short: "OR",  cls: "border-orange-500/25 bg-orange-500/10 text-orange-400" },
  gemini:     { short: "GEM", cls: "border-sky-500/25 bg-sky-500/10 text-sky-400" },
  groq:       { short: "GRQ", cls: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" },
};

const ALL_SKILLS = [
  "create_lead", "create_task", "update_deal", "query_data", "draft_email",
  "create_proposal", "log_outreach", "score_lead", "analyze_website",
  "competitor_research", "generate_copy", "content_calendar", "generate_report",
  "create_project", "create_invoice", "build_website", "edit_website",
  "optimize_seo", "accessibility_audit", "add_website_section", "generate_sitemap",
];

interface CustomAgent {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  system_prompt: string;
  skills: string[];
  enabled: boolean;
}

const emptyAgent: Omit<CustomAgent, "id"> = {
  agent_id: "",
  name: "",
  role: "",
  provider: "openrouter",
  model: "deepseek/deepseek-r1:free",
  system_prompt: "",
  skills: [],
  enabled: true,
};

const ROLE_BADGE: Record<CatalogAgent["role"], { label: string; className: string }> = {
  ceo:        { label: "CEO",        className: "border-primary/30 bg-primary/10 text-primary" },
  supervisor: { label: "Supervisor", className: "border-blue-400/30 bg-blue-400/10 text-blue-400" },
  worker:     { label: "Worker",     className: "border-white/15 bg-white/[0.04] text-muted-foreground" },
  auditor:    { label: "Auditor",    className: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400" },
  validator:  { label: "Validator",  className: "border-green-400/30 bg-green-400/10 text-green-400" },
  persona:    { label: "Persona",    className: "border-pink-400/30 bg-pink-400/10 text-pink-400" },
};

// ─── Org Department Section ───────────────────────────────────────────────────
function DeptSection({ dept }: { dept: AgentDept }) {
  const [open, setOpen] = useState(true);
  const meta   = DEPT_META[dept];
  const agents = getCatalogByDept(dept);
  const Icon   = meta.icon;

  return (
    <div className="ardeno-panel rounded-[22px] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: `${meta.color}14`, border: `1px solid ${meta.color}28` }}
        >
          <Icon className="h-4 w-4" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span className="text-[13px] font-semibold text-foreground">{meta.label}</span>
          <span className="ml-2 text-[11px] text-muted-foreground">{meta.description}</span>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 font-data text-[11px]"
          style={{ color: meta.color, borderColor: `${meta.color}30`, backgroundColor: `${meta.color}10` }}
        >
          {agents.length}
        </Badge>
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Agents */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-2 px-4 pb-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => {
                const badge = ROLE_BADGE[agent.role];
                return (
                  <div
                    key={agent.id}
                    className="flex items-start gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                      style={{ backgroundColor: `${meta.color}14`, border: `1px solid ${meta.color}22` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-foreground leading-tight">{agent.name}</p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] ${badge.className}`}>
                          {badge.label}
                        </span>
                        <span className={`inline-flex items-center rounded border px-1 py-0.5 text-[9px] font-mono font-medium uppercase tracking-wide ${PROVIDER_CHIP[agent.provider].cls}`}>
                          {PROVIDER_CHIP[agent.provider].short}
                        </span>
                        <span className="text-[9px] text-muted-foreground/60 font-mono truncate max-w-[80px]">
                          {agent.model.split("/").pop()?.replace(":free", "") ?? agent.model}
                        </span>
                      </div>
                      {agent.description && (
                        <p className="mt-1 text-[10px] text-muted-foreground/50 leading-tight line-clamp-2">{agent.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgentManager() {
  const [tab,          setTab]          = useState<"workforce" | "performance">("workforce");
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editing,      setEditing]      = useState<CustomAgent | null>(null);
  const [form,         setForm]         = useState<Omit<CustomAgent, "id">>(emptyAgent);

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    const { data } = await supabase.from("custom_agents").select("*").order("created_at");
    setCustomAgents((data as unknown as CustomAgent[]) || []);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyAgent }); setDialogOpen(true); };
  const openEdit   = (agent: CustomAgent) => {
    setEditing(agent);
    setForm({
      agent_id: agent.agent_id, name: agent.name, role: agent.role,
      provider: agent.provider, model: agent.model,
      system_prompt: agent.system_prompt, skills: agent.skills, enabled: agent.enabled,
    });
    setDialogOpen(true);
  };

  const saveAgent = async () => {
    if (!form.agent_id || !form.name) { toast.error("Agent ID and Name are required"); return; }
    const agentId = form.agent_id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (editing) {
      const { error } = await supabase.from("custom_agents").update({
        name: form.name, role: form.role, provider: form.provider, model: form.model,
        system_prompt: form.system_prompt, skills: form.skills, enabled: form.enabled,
        updated_at: new Date().toISOString(),
      } as any).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success(`Updated ${form.name}`);
    } else {
      const { error } = await supabase.from("custom_agents").insert({
        agent_id: agentId, name: form.name, role: form.role, provider: form.provider,
        model: form.model, system_prompt: form.system_prompt,
        skills: form.skills, enabled: form.enabled,
      } as any);
      if (error) { toast.error(error.message); return; }
      toast.success(`Created ${form.name}`);
    }
    setDialogOpen(false);
    loadAgents();
  };

  const deleteAgent = async (agent: CustomAgent) => {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    const { error } = await supabase.from("custom_agents").delete().eq("id", agent.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Deleted ${agent.name}`);
    loadAgents();
  };

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div
      initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="page-shell page-atmosphere max-w-6xl space-y-6"
    >
      {/* ── Hero banner ── */}
      <motion.div variants={fadeUp} className="ardeno-panel overflow-hidden rounded-[28px] px-6 py-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,79,0,0.14),transparent_30%)]" />
        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <ArdenoMark className="h-12 w-12 p-2.5" glow />
              <span className="brand-chip">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Agent Governance
              </span>
            </div>
            <h1 className="font-display text-[clamp(2rem,3vw,3.2rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-foreground">
              Build and govern the Ardeno AI workforce.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Configure specialist agents with stronger prompts, cleaner models, and reusable skills so every system in Ardeno OS feels intentional.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="ardeno-panel rounded-[20px] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">AI Workforce</div>
              <div className="mt-2 font-display text-3xl text-foreground">{AGENT_CATALOG.length + customAgents.length}</div>
              <div className="text-sm text-muted-foreground">Total agents</div>
            </div>
            <div className="ardeno-panel rounded-[20px] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Departments</div>
              <div className="mt-2 font-display text-3xl text-foreground">{CATALOG_DEPT_ORDER.length}</div>
              <div className="text-sm text-muted-foreground">Specialist depts</div>
            </div>
            <div className="ardeno-panel rounded-[20px] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Custom</div>
              <div className="mt-2 font-display text-3xl text-foreground">{customAgents.length}</div>
              <div className="text-sm text-muted-foreground">User-defined agents</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-1">
          {([["workforce", "Workforce"], ["performance", "Performance"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-[14px] px-4 py-2 text-[13px] font-medium transition-all ${
                tab === key
                  ? "bg-primary/12 border border-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-2 font-data text-[11px] opacity-60">
                {key === "workforce" ? AGENT_CATALOG.length + customAgents.length : ""}
              </span>
            </button>
          ))}
        </div>

        {tab === "workforce" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-white/10 bg-[#0f1012]/96">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {editing ? "Edit Agent" : "Create New Agent"}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Agent ID</label>
                    <Input
                      value={form.agent_id}
                      onChange={(e) => setForm((p) => ({ ...p, agent_id: e.target.value }))}
                      placeholder="my-custom-agent"
                      disabled={!!editing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="My Custom Agent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Role Description</label>
                  <Input
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    placeholder="What does this agent specialise in?"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Provider</label>
                    <Select value={form.provider} onValueChange={(v) => setForm((p) => ({ ...p, provider: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openrouter">OpenRouter (Free)</SelectItem>
                        <SelectItem value="gemini">Gemini API</SelectItem>
                        <SelectItem value="groq">Groq (Fast)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Model</label>
                    {form.provider === "openrouter" ? (
                      <Select value={form.model} onValueChange={(v) => setForm((p) => ({ ...p, model: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPENROUTER_FREE_MODELS.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : form.provider === "groq" ? (
                      <Select value={form.model} onValueChange={(v) => setForm((p) => ({ ...p, model: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GROQ_MODELS.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value="gemini-2.0-flash" disabled />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">System Prompt</label>
                  <Textarea
                    value={form.system_prompt}
                    onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
                    placeholder="You are an expert..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                          form.skills.includes(skill)
                            ? "border-primary/20 bg-primary/12 text-primary"
                            : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Enabled</div>
                    <div className="text-xs text-muted-foreground">Allow this agent to appear in Ardeno OS workflows.</div>
                  </div>
                  <Switch checked={form.enabled} onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v }))} />
                </div>

                <Button onClick={saveAgent} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {editing ? "Update Agent" : "Create Agent"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* ── TAB: Workforce ── */}
      {tab === "workforce" && (
        <motion.div
          key="workforce"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* ── Custom Agents ── */}
          {customAgents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Custom Agents
                  <span className="ml-2 font-data text-[11px] opacity-50">{customAgents.length}</span>
                </h3>
              </div>
              <AnimatePresence>
                {customAgents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="ardeno-panel rounded-[20px] p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border ${agent.enabled ? "border-primary/18 bg-primary/10" : "border-white/10 bg-white/[0.03]"}`}>
                        <Sparkles className={`h-5 w-5 ${agent.enabled ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium text-foreground">{agent.name}</span>
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase tracking-wide ${PROVIDER_CHIP[agent.provider as AgentProvider]?.cls ?? "border-white/10 bg-white/5 text-muted-foreground"}`}>
                            {PROVIDER_CHIP[agent.provider as AgentProvider]?.short ?? agent.provider}
                          </span>
                          {!agent.enabled ? <Badge variant="secondary">Disabled</Badge> : <Badge>Enabled</Badge>}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {agent.role || agent.system_prompt.slice(0, 120)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-data text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            <Cpu className="h-3.5 w-3.5" />
                            {agent.model.split("/").pop()?.replace(":free", "")}
                          </span>
                          {agent.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))}
                          {agent.skills.length > 4 && (
                            <Badge variant="outline">+{agent.skills.length - 4} more</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(agent)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline" size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteAgent(agent)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {customAgents.length === 0 && !loading && (
            <ArdenoEmptyState
              icon={Sparkles}
              title="No custom agents yet"
              description="Create a specialist agent for delivery, outreach, analysis, or internal operations."
              action={
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Agent
                </Button>
              }
            />
          )}

          {/* ── Unified Workforce ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">AI Workforce</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                {AGENT_CATALOG.length} agents across {CATALOG_DEPT_ORDER.length} departments — Gemini · Groq · OpenRouter
              </p>
            </div>
            {CATALOG_DEPT_ORDER.map((dept) => (
              <DeptSection key={dept} dept={dept} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── TAB: Performance ── */}
      {tab === "performance" && (
        <motion.div
          key="performance"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AgentsOverviewPage />
        </motion.div>
      )}
    </motion.div>
  );
}
