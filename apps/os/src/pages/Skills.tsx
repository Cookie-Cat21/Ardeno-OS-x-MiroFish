import { useState, useMemo } from "react";
import {
  Wrench, Search, UserPlus, ListTodo, TrendingUp, Mail, FileText, Send, Globe, Target,
  Pen, Calendar, BarChart3, FileBarChart, FolderPlus, Receipt, Users, Zap, Bot,
  CheckCircle2, XCircle, AlertTriangle, Clock, Activity, History, ChevronDown, Trash2, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AGENT_SKILLS, AgentSkill, SkillCategory,
  SKILL_CATEGORY_LABELS, SKILL_CATEGORY_COLORS,
  DEFAULT_AGENT_SKILLS, getSkillsForAgent
} from "@/lib/agent-skills";
import { AGENTS } from "@/lib/agents";
import { useSkillStats, useSkillOverrides, useToggleSkillOverride } from "@/hooks/useSkillStats";
import { useCustomSkills, useDeleteCustomSkill, useToggleCustomSkill } from "@/hooks/useCustomSkills";
import CreateSkillDialog from "@/components/skills/CreateSkillDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { cardHoverMotion, pageVariants, sectionReveal } from "@/lib/motion";

const ICON_MAP: Record<string, any> = {
  UserPlus, ListTodo, TrendingUp, Search, Mail, FileText, Send, Globe, Target,
  Pen, Calendar, BarChart3, FileBarChart, FolderPlus, Receipt, Wrench, Zap, Bot,
};

const ALL_CATEGORIES: SkillCategory[] = ["data", "communication", "research", "content", "analysis", "automation"];

export default function Skills() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | SkillCategory>("all");
  const [historyOpen, setHistoryOpen] = useState(false);

  const { stats, isLoading: statsLoading } = useSkillStats();
  const { data: overrides = [] } = useSkillOverrides();
  const toggleMutation = useToggleSkillOverride();
  const { data: customSkills = [] } = useCustomSkills();
  const deleteCustomSkill = useDeleteCustomSkill();
  const toggleCustomSkill = useToggleCustomSkill();

  const { data: executionHistory = [] } = useQuery({
    queryKey: ["skill-execution-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("skill_executions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as any[];
    },
  });

  const overrideMap = useMemo(() => {
    const map: Record<string, { enabled: boolean; auto_disabled: boolean; disabled_reason: string | null }> = {};
    for (const o of overrides) {
      map[o.skill_id] = { enabled: o.enabled, auto_disabled: o.auto_disabled, disabled_reason: o.disabled_reason };
    }
    return map;
  }, [overrides]);

  const filteredSkills = useMemo(() => {
    return AGENT_SKILLS.filter(s => {
      const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const filteredCustomSkills = useMemo(() => {
    return customSkills.filter(s => {
      const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory, customSkills]);

  const toggleSkill = (skillId: string, currentEnabled: boolean) => {
    toggleMutation.mutate({ skillId, enabled: !currentEnabled });
  };

  // Compute which agents use each skill
  const skillAgentMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const assignment of DEFAULT_AGENT_SKILLS) {
      const agent = AGENTS.find(a => a.id === assignment.agentId);
      if (!agent) continue;
      for (const skillId of assignment.skillIds) {
        if (!map[skillId]) map[skillId] = [];
        map[skillId].push(agent.name);
      }
    }
    return map;
  }, []);

  const totalExecutions = Object.values(stats).reduce((sum, s) => sum + s.total_executions, 0);
  const totalFailures = Object.values(stats).reduce((sum, s) => sum + s.failures, 0);
  const autoDisabledCount = overrides.filter(o => o.auto_disabled && !o.enabled).length;
  const enabledCount = AGENT_SKILLS.filter(s => {
    const override = overrideMap[s.id];
    return override ? override.enabled : true;
  }).length;

  return (
    <motion.div initial="hidden" animate="show" variants={pageVariants} className="page-shell page-atmosphere max-w-7xl space-y-6">
      {/* Header */}
      <motion.div variants={sectionReveal}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          Agent Skills
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          {enabledCount} of {AGENT_SKILLS.length + customSkills.length} skills active · Self-learning system
        </p>
      </motion.div>
      <CreateSkillDialog />

      {/* Stats Banner */}
      <motion.div variants={sectionReveal} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-display font-bold text-foreground">{totalExecutions}</p>
              <p className="text-[11px] text-muted-foreground font-body">Total Executions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {totalExecutions > 0 ? Math.round(((totalExecutions - totalFailures) / totalExecutions) * 100) : 100}%
              </p>
              <p className="text-[11px] text-muted-foreground font-body">Overall Success</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xl font-display font-bold text-foreground">{totalFailures}</p>
              <p className="text-[11px] text-muted-foreground font-body">Failures</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
            <div>
              <p className="text-xl font-display font-bold text-foreground">{autoDisabledCount}</p>
              <p className="text-[11px] text-muted-foreground font-body">Auto-Disabled</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={sectionReveal} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {ALL_CATEGORIES.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs capitalize">
                {SKILL_CATEGORY_LABELS[cat].split(" ")[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Skills Grid */}
      <motion.div variants={sectionReveal} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSkills.map(skill => {
          const IconComp = ICON_MAP[skill.icon] || Wrench;
          const override = overrideMap[skill.id];
          const isEnabled = override ? override.enabled : true;
          const isAutoDisabled = override?.auto_disabled && !override.enabled;
          const agents = skillAgentMap[skill.id] || [];
          const catColors = SKILL_CATEGORY_COLORS[skill.category];
          const skillStat = stats[skill.id];

          const usageCount = skillStat?.total_executions ?? 0;
          const successRate = skillStat?.success_rate ?? 100;
          const avgTime = skillStat?.avg_execution_time ?? 0;
          const lastUsed = skillStat?.last_used;

          return (
            <motion.div key={skill.id} {...cardHoverMotion}>
            <Card
              className={`relative overflow-hidden transition-all duration-200 hover:border-primary/30 ${
                isEnabled ? "bg-card border-border" : "bg-card/50 border-border/50 opacity-70"
              } ${isAutoDisabled ? "border-destructive/30" : ""}`}
            >
              {isAutoDisabled && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-destructive" />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${catColors}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-display flex items-center gap-2">
                        {skill.name}
                        {isAutoDisabled && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px]">
                              <p className="text-xs">{override?.disabled_reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </CardTitle>
                      <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 border ${catColors}`}>
                        {SKILL_CATEGORY_LABELS[skill.category]}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleSkill(skill.id, isEnabled)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  {skill.description}
                </p>

                {/* Live Stats Row */}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-body">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    {usageCount} uses
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className={`h-3 w-3 ${successRate >= 80 ? "text-[hsl(var(--success))]" : successRate >= 50 ? "text-[hsl(var(--warning))]" : "text-destructive"}`} />
                    {successRate}%
                  </span>
                  {avgTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {avgTime}ms
                    </span>
                  )}
                </div>

                {/* Success Rate Bar */}
                <Progress
                  value={successRate}
                  className={`h-1 ${successRate < 50 ? "[&>div]:bg-destructive" : successRate < 80 ? "[&>div]:bg-[hsl(var(--warning))]" : ""}`}
                />

                {/* Last used */}
                {lastUsed && (
                  <p className="text-[10px] text-muted-foreground/60 font-body">
                    Last used {formatDistanceToNow(new Date(lastUsed), { addSuffix: true })}
                  </p>
                )}

                {/* Agents using this skill */}
                {agents.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5 font-body">
                      Used by {agents.length} agent{agents.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agents.slice(0, 4).map(name => (
                        <Badge key={name} variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/50 text-muted-foreground border-border/30">
                          {name}
                        </Badge>
                      ))}
                      {agents.length > 4 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/50 text-muted-foreground">
                              +{agents.length - 4}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-0.5">
                              {agents.slice(4).map(n => <div key={n}>{n}</div>)}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Custom Skills Section */}
      {filteredCustomSkills.length > 0 && (
        <motion.div variants={sectionReveal}>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Custom Skills ({customSkills.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCustomSkills.map(skill => {
              const IconComp = ICON_MAP[skill.icon] || Wrench;
              const catColors = SKILL_CATEGORY_COLORS[skill.category as SkillCategory] || SKILL_CATEGORY_COLORS.automation;
              const skillStat = stats[skill.skill_id];
              const usageCount = skillStat?.total_executions ?? 0;
              const successRate = skillStat?.success_rate ?? 100;

              return (
                <motion.div key={skill.id} {...cardHoverMotion}>
                <Card
                  className={`relative overflow-hidden transition-all duration-200 hover:border-primary/30 ${
                    skill.enabled ? "bg-card border-border" : "bg-card/50 border-border/50 opacity-70"
                  }`}
                >
                  {skill.created_by_orchestrator && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${catColors}`}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-display flex items-center gap-2">
                            {skill.name}
                            {skill.created_by_orchestrator && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                                <Bot className="h-2.5 w-2.5 mr-0.5" /> Auto
                              </Badge>
                            )}
                          </CardTitle>
                          <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 border ${catColors}`}>
                            {SKILL_CATEGORY_LABELS[skill.category as SkillCategory] || skill.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={skill.enabled}
                          onCheckedChange={(v) => toggleCustomSkill.mutate({ id: skill.id, enabled: v })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete skill "${skill.name}"?`)) {
                              deleteCustomSkill.mutate(skill.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground font-body leading-relaxed">{skill.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-body">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> {usageCount} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className={`h-3 w-3 ${successRate >= 80 ? "text-[hsl(var(--success))]" : "text-destructive"}`} />
                        {successRate}%
                      </span>
                    </div>
                    {Object.keys(skill.parameters?.properties || {}).length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5 font-body">Parameters</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(skill.parameters.properties || {}).map(p => (
                            <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/50">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {filteredSkills.length === 0 && filteredCustomSkills.length === 0 && (
        <ArdenoEmptyState
          icon={Wrench}
          title="No skills match your search"
          description="Refine the category or query to surface the right Ardeno capabilities."
        />
      )}

      {/* Agent Skills Overview */}
      <motion.div variants={sectionReveal} className="pt-4">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Skills per Agent
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {AGENTS.filter(a => DEFAULT_AGENT_SKILLS.some(d => d.agentId === a.id)).map(agent => {
            const skills = getSkillsForAgent(agent.id);
            return (
              <Card key={agent.id} className="bg-card/70 border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-display font-medium text-foreground">{agent.name}</h3>
                    <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">
                      {agent.provider}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mb-3 line-clamp-1">{agent.role}</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.map(s => {
                      const catColor = SKILL_CATEGORY_COLORS[s.category];
                      const override = overrideMap[s.id];
                      const disabled = override && !override.enabled;
                      return (
                        <Badge
                          key={s.id}
                          className={`text-[10px] px-1.5 py-0 border ${catColor} ${disabled ? "opacity-40 line-through" : ""}`}
                        >
                          {s.name}
                        </Badge>
                      );
                    })}
                    {skills.length === 0 && (
                      <span className="text-[11px] text-muted-foreground/50 italic">No skills assigned</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Execution History */}
      <motion.div variants={sectionReveal}>
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="pt-4">
        <CollapsibleTrigger className="flex items-center gap-2 text-lg font-display font-semibold text-foreground w-full">
          <History className="h-5 w-5 text-primary" />
          Execution History
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${historyOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          {executionHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No executions recorded yet</div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Skill</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Agent</th>
                      <th className="text-center px-4 py-2.5 text-xs text-muted-foreground font-medium">Status</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Time</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionHistory.map((exec: any) => (
                      <tr key={exec.id} className="border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5 text-foreground font-medium">{exec.skill_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{exec.agent_name}</td>
                        <td className="px-4 py-2.5 text-center">
                          {exec.success ? (
                            <Badge variant="outline" className="text-[10px] border-[hsl(var(--success))]/30 text-[hsl(var(--success))]">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Pass
                            </Badge>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                                  <XCircle className="h-3 w-3 mr-1" /> Fail
                                </Badge>
                              </TooltipTrigger>
                              {exec.error_message && (
                                <TooltipContent className="max-w-[250px]">
                                  <p className="text-xs">{exec.error_message}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-data text-muted-foreground">
                          {exec.execution_time_ms ? `${exec.execution_time_ms}ms` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground text-[11px]">
                          {formatDistanceToNow(new Date(exec.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
      </motion.div>
    </motion.div>
  );
}
