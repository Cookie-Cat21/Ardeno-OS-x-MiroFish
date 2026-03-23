import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, X } from "lucide-react";
import { useCreateCustomSkill } from "@/hooks/useCustomSkills";
import { SkillCategory, SKILL_CATEGORY_LABELS } from "@/lib/agent-skills";

const CATEGORIES: SkillCategory[] = ["data", "communication", "research", "content", "analysis", "automation"];
const ICONS = ["Wrench", "UserPlus", "ListTodo", "TrendingUp", "Search", "Mail", "FileText", "Send", "Globe", "Target", "Pen", "Calendar", "BarChart3", "FileBarChart", "FolderPlus", "Receipt", "Zap", "Bot"];

interface ParamField {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export default function CreateSkillDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateCustomSkill();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SkillCategory>("automation");
  const [icon, setIcon] = useState("Wrench");
  const [params, setParams] = useState<ParamField[]>([]);
  const [newParamName, setNewParamName] = useState("");

  const skillId = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const addParam = () => {
    if (!newParamName.trim()) return;
    setParams(prev => [...prev, { name: newParamName.trim(), type: "string", description: "", required: false }]);
    setNewParamName("");
  };

  const removeParam = (idx: number) => setParams(prev => prev.filter((_, i) => i !== idx));

  const updateParam = (idx: number, field: keyof ParamField, value: any) => {
    setParams(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const toolParams: Record<string, any> = {
      type: "object",
      properties: {} as Record<string, any>,
      required: params.filter(p => p.required).map(p => p.name),
    };
    for (const p of params) {
      toolParams.properties[p.name] = { type: p.type, description: p.description };
    }

    createMutation.mutate({
      skill_id: skillId,
      name: name.trim(),
      description: description.trim(),
      category,
      icon,
      enabled: true,
      created_by_orchestrator: false,
      parameters: toolParams,
    }, {
      onSuccess: () => {
        setOpen(false);
        setName(""); setDescription(""); setCategory("automation"); setIcon("Wrench"); setParams([]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg gap-2">
          <Plus className="h-4 w-4" /> New Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Skill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Skill Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Custom Skill" className="bg-secondary/50 border-border/50 rounded-lg text-sm" />
              {name && <p className="text-[10px] text-muted-foreground">ID: {skillId}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={category} onValueChange={v => setCategory(v as SkillCategory)}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{SKILL_CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this skill do?" rows={2} className="bg-secondary/50 border-border/50 rounded-lg text-sm resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Icon</label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="bg-secondary/50 border-border/50 rounded-lg text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Parameters */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Parameters</label>
            {params.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{p.name}</span>
                    <Select value={p.type} onValueChange={v => updateParam(idx, "type", v)}>
                      <SelectTrigger className="h-6 w-20 text-[10px] bg-secondary/50 border-border/50 rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">string</SelectItem>
                        <SelectItem value="number">number</SelectItem>
                        <SelectItem value="boolean">boolean</SelectItem>
                        <SelectItem value="array">array</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => updateParam(idx, "required", !p.required)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${p.required ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary/50 text-muted-foreground border border-border/30"}`}
                    >
                      {p.required ? "required" : "optional"}
                    </button>
                  </div>
                  <Input
                    value={p.description}
                    onChange={e => updateParam(idx, "description", e.target.value)}
                    placeholder="Parameter description..."
                    className="h-7 text-[11px] bg-secondary/50 border-border/50 rounded"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeParam(idx)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newParamName}
                onChange={e => setNewParamName(e.target.value)}
                placeholder="Parameter name..."
                className="bg-secondary/50 border-border/50 rounded-lg text-sm"
                onKeyDown={e => e.key === "Enter" && addParam()}
              />
              <Button variant="outline" size="sm" onClick={addParam} disabled={!newParamName.trim()}>Add</Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={!name.trim() || createMutation.isPending} className="w-full rounded-lg gap-2">
            <Save className="h-4 w-4" /> Create Skill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
