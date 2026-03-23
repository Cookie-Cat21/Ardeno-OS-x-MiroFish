import { useState } from "react";
import { MOCK_PROMPTS } from "@/lib/mock-data";
import { Prompt } from "@/lib/types";
import { AGENTS } from "@/lib/agents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Play, Palette, FileText, FolderOpen, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;

const CATEGORIES = ["All", "Emails", "Proposals", "SEO", "Reports", "Social", "Research"];

interface Project {
  id: string;
  client_name: string;
  project_type: string | null;
  status: string | null;
  value: number | null;
}

export default function Assets() {
  const [prompts] = useState<Prompt[]>(MOCK_PROMPTS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("projects").select("id, client_name, project_type, status, value").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setProjects(data);
    });
  }, []);

  const filteredPrompts = prompts.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      (p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()))
  );

  const portfolioProjects = projects.filter(p => p.status === "Delivered" || p.status === "Review");

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-[1440px] space-y-6">
      <motion.div variants={fadeUp}>
        <div className="section-label">Assets</div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Tabs defaultValue="prompts">
          <TabsList className="bg-secondary/50 rounded-lg backdrop-blur-sm border border-border/30">
            <TabsTrigger value="prompts" className="text-sm rounded-md">Prompt Library</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-sm rounded-md">Portfolio</TabsTrigger>
            <TabsTrigger value="brand-kits" className="text-sm rounded-md">Brand Kits</TabsTrigger>
            <TabsTrigger value="contracts" className="text-sm rounded-md">Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search prompts..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary/50 border-border/50 pl-10 rounded-lg" />
              </div>
              <Button size="sm" className="rounded-lg" onClick={() => navigate("/chat")}>
                <Plus className="h-4 w-4 mr-1.5" /> New Prompt
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategory === cat ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/50 text-muted-foreground border border-border/30 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredPrompts.map((prompt) => (
                <div key={prompt.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{prompt.title}</h3>
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">{prompt.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-data">Used {prompt.use_count}x</span>
                      <button onClick={() => { navigator.clipboard.writeText(prompt.content); toast.success("Copied"); }} className="h-7 w-7 rounded-md border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-all">
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button onClick={() => navigate("/chat")} className="h-7 w-7 rounded-md border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-all">
                        <Play className="h-3 w-3 text-primary" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-data whitespace-pre-wrap line-clamp-2">{prompt.content}</p>
                  {prompt.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {prompt.variables.map((v) => (
                        <span key={v} className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-md border border-border/30">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                  {prompt.agent_id && (
                    <p className="text-[10px] text-muted-foreground mt-2">Agent: {AGENTS.find(a => a.id === prompt.agent_id)?.name}</p>
                  )}
                </div>
              ))}
              {filteredPrompts.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No prompts found</p>}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{portfolioProjects.length} completed projects</p>
              <Button size="sm" variant="outline" className="rounded-lg border-border/50" onClick={() => navigate("/chat")}>
                Generate Case Study
              </Button>
            </div>
            {portfolioProjects.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <p className="text-xs text-muted-foreground">No delivered projects yet</p>
              </div>
            ) : portfolioProjects.map((project) => (
              <div key={project.id} className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer" onClick={() => navigate("/projects")}>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground">{project.client_name}</h3>
                  <p className="text-xs text-muted-foreground">{project.project_type} · {project.status}</p>
                </div>
                {project.value && <span className="text-xs font-data text-primary">${project.value.toLocaleString()}</span>}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="brand-kits" className="space-y-3 mt-6">
            <p className="text-sm text-muted-foreground">Brand kits are stored per project. Select a project to manage.</p>
            {projects.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <p className="text-xs text-muted-foreground">No projects yet — create one first</p>
              </div>
            ) : projects.map((project) => (
              <div key={project.id} className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer" onClick={() => navigate("/projects")}>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">{project.client_name}</h3>
                  <p className="text-xs text-muted-foreground">{project.project_type}</p>
                </div>
                <span className="text-xs text-muted-foreground">Edit →</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Contract templates for client agreements</p>
              <Button size="sm" className="rounded-lg" onClick={() => navigate("/chat")}>
                <Plus className="h-4 w-4 mr-1.5" /> New Template
              </Button>
            </div>
            {["Standard Web Design Contract", "Retainer Agreement", "NDA Template"].map((name) => (
              <div key={name} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">{name}</h3>
                  <p className="text-xs text-muted-foreground">Template · Auto-fill from project data</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg border-border/50 text-xs" onClick={() => navigate("/chat")}>
                  Edit
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
