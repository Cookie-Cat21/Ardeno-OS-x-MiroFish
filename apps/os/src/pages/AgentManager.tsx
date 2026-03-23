import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AGENTS } from "@/lib/agents";
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
import { Plus, Bot, Pencil, Trash2, Sparkles, Save, ShieldCheck, Cpu, Orbit } from "lucide-react";

const OPENROUTER_FREE_MODELS = [
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (Reasoning)" },
  { id: "qwen/qwen3-32b:free", label: "Qwen3 32B (Coding)" },
  { id: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick (Creative)" },
  { id: "google/gemini-2.5-flash:free", label: "Gemini Flash (General)" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small (Lightweight)" },
];

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

export default function AgentManager() {
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomAgent | null>(null);
  const [form, setForm] = useState<Omit<CustomAgent, "id">>(emptyAgent);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const { data } = await supabase.from("custom_agents").select("*").order("created_at");
    setCustomAgents((data as unknown as CustomAgent[]) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyAgent });
    setDialogOpen(true);
  };

  const openEdit = (agent: CustomAgent) => {
    setEditing(agent);
    setForm({
      agent_id: agent.agent_id,
      name: agent.name,
      role: agent.role,
      provider: agent.provider,
      model: agent.model,
      system_prompt: agent.system_prompt,
      skills: agent.skills,
      enabled: agent.enabled,
    });
    setDialogOpen(true);
  };

  const saveAgent = async () => {
    if (!form.agent_id || !form.name) {
      toast.error("Agent ID and Name are required");
      return;
    }

    const agentId = form.agent_id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (editing) {
      const { error } = await supabase
        .from("custom_agents")
        .update({
          name: form.name,
          role: form.role,
          provider: form.provider,
          model: form.model,
          system_prompt: form.system_prompt,
          skills: form.skills,
          enabled: form.enabled,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", editing.id);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Updated ${form.name}`);
    } else {
      const { error } = await supabase
        .from("custom_agents")
        .insert({
          agent_id: agentId,
          name: form.name,
          role: form.role,
          provider: form.provider,
          model: form.model,
          system_prompt: form.system_prompt,
          skills: form.skills,
          enabled: form.enabled,
        } as any);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Created ${form.name}`);
    }

    setDialogOpen(false);
    loadAgents();
  };

  const deleteAgent = async (agent: CustomAgent) => {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    const { error } = await supabase.from("custom_agents").delete().eq("id", agent.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deleted ${agent.name}`);
    loadAgents();
  };

  const toggleSkill = (skill: string) => {
    setForm((previous) => ({
      ...previous,
      skills: previous.skills.includes(skill)
        ? previous.skills.filter((value) => value !== skill)
        : [...previous.skills, skill],
    }));
  };

  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="page-shell page-atmosphere max-w-6xl space-y-6">
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
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Built In</div>
              <div className="mt-2 font-display text-3xl text-foreground">{AGENTS.length}</div>
              <div className="text-sm text-muted-foreground">Core Ardeno agents</div>
            </div>
            <div className="ardeno-panel rounded-[20px] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Custom</div>
              <div className="mt-2 font-display text-3xl text-foreground">{customAgents.length}</div>
              <div className="text-sm text-muted-foreground">User-defined agents</div>
            </div>
            <div className="ardeno-panel rounded-[20px] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Enabled</div>
              <div className="mt-2 font-display text-3xl text-foreground">{customAgents.filter((agent) => agent.enabled).length}</div>
              <div className="text-sm text-muted-foreground">Ready for orchestration</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <div className="section-label">Agent Registry</div>
          <p className="mt-1 text-sm text-muted-foreground">Curate built-in specialists and extend the system with your own agents.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-white/10 bg-[#0f1012]/96">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{editing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Agent ID</label>
                  <Input
                    value={form.agent_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, agent_id: event.target.value }))}
                    placeholder="my-custom-agent"
                    disabled={!!editing}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Name</label>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="My Custom Agent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Role Description</label>
                <Input
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="What does this agent specialise in?"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Provider</label>
                  <Select value={form.provider} onValueChange={(value) => setForm((prev) => ({ ...prev, provider: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                      <SelectItem value="gemini">Lovable AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Model</label>
                  {form.provider === "openrouter" ? (
                    <Select value={form.model} onValueChange={(value) => setForm((prev) => ({ ...prev, model: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPENROUTER_FREE_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value="gemini-2.5-flash" disabled />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">System Prompt</label>
                <Textarea
                  value={form.system_prompt}
                  onChange={(event) => setForm((prev) => ({ ...prev, system_prompt: event.target.value }))}
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
                <Switch checked={form.enabled} onCheckedChange={(value) => setForm((prev) => ({ ...prev, enabled: value }))} />
              </div>

              <Button onClick={saveAgent} className="w-full gap-2">
                <Save className="h-4 w-4" />
                {editing ? "Update Agent" : "Create Agent"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Built-in Agents</h3>
          <Badge variant="secondary">{AGENTS.length} Core Profiles</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="ardeno-panel ardeno-panel-interactive rounded-[20px] p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-primary/18 bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{agent.name}</span>
                    <Badge variant="outline" className="uppercase">{agent.provider}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{agent.role}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-data text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {agent.model.split("/").pop()?.replace(":free", "")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-success">
                      <Orbit className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Custom Agents</h3>
          <Badge>{customAgents.length} Configured</Badge>
        </div>

        {customAgents.length === 0 && !loading ? (
          <ArdenoEmptyState
            icon={Sparkles}
            title="No custom agents yet"
            description="Create a specialist agent for delivery, outreach, analysis, or internal operations and add it to your Ardeno OS roster."
            action={
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Agent
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
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
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] border ${agent.enabled ? "border-primary/18 bg-primary/10" : "border-white/10 bg-white/[0.03]"}`}>
                      <Sparkles className={`h-5 w-5 ${agent.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-medium text-foreground">{agent.name}</span>
                        <Badge variant="outline">{agent.provider}</Badge>
                        {!agent.enabled ? <Badge variant="secondary">Disabled</Badge> : <Badge>Enabled</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{agent.role || agent.system_prompt.slice(0, 120)}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-data text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          <Cpu className="h-3.5 w-3.5" />
                          {agent.model.split("/").pop()?.replace(":free", "")}
                        </span>
                        {agent.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                        {agent.skills.length > 4 ? <Badge variant="outline">+{agent.skills.length - 4} more</Badge> : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(agent)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteAgent(agent)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
