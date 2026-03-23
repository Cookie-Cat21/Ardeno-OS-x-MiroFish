import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Globe, Search, Palette, FileCode, Loader2, Download,
  CheckCircle2, ArrowRight, Eye, Code, Send, Bot,
  Monitor, Tablet, Smartphone, Save, ChevronDown, ChevronUp,
  Wand2, ShieldCheck, Gauge, Layout, User, Sparkles,
  PanelRightOpen, PanelRightClose, FolderOpen, Trash2, Clock, X
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type PreviewDevice = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES: Record<PreviewDevice, { width: string; label: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  mobile: { width: "375px", label: "Mobile", icon: Smartphone },
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentLogs?: AgentLog[];
  type?: "build" | "edit" | "improve" | "info";
}

interface AgentLog {
  name: string;
  icon: string;
  status: "idle" | "running" | "complete" | "error";
  description: string;
  output?: string;
  startedAt: number;
  completedAt?: number;
}

interface Suggestion {
  id: string;
  category: "ux" | "seo" | "performance" | "authenticity";
  severity: "critical" | "important" | "nice-to-have";
  title: string;
  description: string;
  fix_instructions: string;
  status?: "pending" | "applying" | "applied" | "rejected";
}

interface SavedWebsite {
  id: string;
  client_name: string;
  industry: string | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function buildPreviewHtml(code: string, design: any): string {
  const headingFont = design?.headingFont || "Inter";
  const bodyFont = design?.bodyFont || "Inter";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, "+")}:wght@400;500;600;700&family=${bodyFont.replace(/ /g, "+")}:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.opacity-100 { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    if (typeof Website !== 'undefined') root.render(React.createElement(Website));
    else if (typeof App !== 'undefined') root.render(React.createElement(App));
    else {
      const components = Object.keys(window).filter(k => typeof window[k] === 'function' && /^[A-Z]/.test(k));
      if (components.length > 0) root.render(React.createElement(window[components[components.length - 1]]));
    }
  </script>
</body>
</html>`;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseUserIntent(message: string): { type: "build" | "edit" | "improve" | "general"; clientName?: string; industry?: string } {
  const lower = message.toLowerCase();

  if (lower.includes("improve") || lower.includes("review") || lower.includes("audit") || lower.includes("check")) {
    return { type: "improve" };
  }

  // Detect build intent: "build a website for X" or "create a site for X"
  const buildMatch = message.match(/(?:build|create|make|generate|design)\s+(?:a\s+)?(?:website|site|page|landing page)\s+(?:for\s+)?["']?([^"',]+?)["']?\s*(?:,|\.|\bin\b|\bthat\b|\bwith\b|\b-\b|$)/i);
  const industryMatch = message.match(/(?:in the\s+|industry:\s*|sector:\s*)["']?([^"',\.]+?)["']?\s*(?:industry|sector|space|field|$)/i);

  if (buildMatch || lower.includes("build") || lower.includes("create a") || lower.includes("generate")) {
    return {
      type: "build",
      clientName: buildMatch?.[1]?.trim(),
      industry: industryMatch?.[1]?.trim(),
    };
  }

  // Otherwise treat as an edit command
  return { type: "edit" };
}

// ─── Component ───────────────────────────────────────────────
export default function WebsiteBuilder() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey! 👋 I'm your **Website Builder AI** — a team of specialized agents ready to build production-ready websites.\n\nTell me what you need:\n- **"Build a website for Coral Bay Architects, a residential architecture firm"**\n- **"Create a landing page for a SaaS analytics tool called Metrix"**\n\nOnce built, you can edit anything by chatting — *"make the hero section bolder"*, *"change the color scheme to dark green"*, *"add a testimonials section"*.`,
      timestamp: new Date(),
      type: "info",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgentLogs, setCurrentAgentLogs] = useState<AgentLog[]>([]);
  const [showAgentPanel, setShowAgentPanel] = useState(true);

  // Streaming state
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const streamAbortRef = useRef(false);

  // Website state
  const [websiteCode, setWebsiteCode] = useState<string | null>(null);
  const [websiteDesign, setWebsiteDesign] = useState<any>(null);
  const [websiteResearch, setWebsiteResearch] = useState<string | null>(null);
  const [websiteContent, setWebsiteContent] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("");

  // Preview state
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Save/load
  const [saving, setSaving] = useState(false);
  const [currentWebsiteId, setCurrentWebsiteId] = useState<string | null>(null);
  const [savedWebsites, setSavedWebsites] = useState<SavedWebsite[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentAgentLogs]);

  // Load saved websites on mount + auto-load from URL param
  useEffect(() => {
    supabase
      .from("generated_websites")
      .select("id, client_name, industry, created_at")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => { if (data) setSavedWebsites(data); });
  }, []);

  // Auto-load website from URL param ?id=xxx
  const autoLoadIdRef = useRef(searchParams.get("id"));
  useEffect(() => {
    const idParam = autoLoadIdRef.current;
    if (idParam) {
      autoLoadIdRef.current = null;
      // Defer to ensure handleLoad is available
      const loadFromUrl = async () => {
        try {
          const { data, error } = await supabase.from("generated_websites").select("*").eq("id", idParam).single();
          if (error) throw error;
          setClientName(data.client_name);
          setIndustry(data.industry || "");
          setWebsiteCode(data.html);
          setWebsiteDesign(data.design);
          setWebsiteResearch(data.research);
          setWebsiteContent(data.content);
          setCurrentWebsiteId(data.id);
          setMessages(prev => [...prev, {
            id: generateId(),
            role: "assistant" as const,
            content: `📂 Loaded **"${data.client_name}"** website from Orchestrator. You can now edit it by chatting.`,
            timestamp: new Date(),
            type: "info" as const,
          }]);
        } catch {
          toast.error("Failed to load website");
        }
      };
      loadFromUrl();
      setSearchParams({}, { replace: true });
    }
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = { ...msg, id: generateId(), timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    return newMsg.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const setAgentStatus = useCallback((name: string, status: AgentLog["status"], output?: string) => {
    setCurrentAgentLogs(prev => prev.map(a =>
      a.name === name
        ? { ...a, status, output, completedAt: status !== "running" ? Date.now() : undefined }
        : a
    ));
  }, []);

  // Stream text character-by-character into a message
  const streamText = useCallback((msgId: string, fullText: string, speed = 12): Promise<void> => {
    return new Promise((resolve) => {
      streamAbortRef.current = false;
      setStreamingMessageId(msgId);
      setStreamedContent("");
      let i = 0;
      const tick = () => {
        if (streamAbortRef.current || i >= fullText.length) {
          setStreamingMessageId(null);
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: fullText } : m));
          resolve();
          return;
        }
        // Advance by chunks for speed
        const chunk = Math.min(speed, fullText.length - i);
        i += chunk;
        setStreamedContent(fullText.slice(0, i));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, []);

  // ─── Build Website ─────────────────────────────────────────
  const handleBuild = async (name: string, ind: string, description: string) => {
    setClientName(name);
    setIndustry(ind);
    setWebsiteCode(null);
    setSuggestions([]);

    const agents: AgentLog[] = [
      { name: "Orchestrator", icon: "zap", status: "running", description: "Planning agent pipeline", startedAt: Date.now() },
      { name: "Website Builder", icon: "globe", status: "idle", description: "Multi-agent build pipeline", startedAt: Date.now() },
    ];
    setCurrentAgentLogs(agents);
    setShowAgentPanel(true);

    const progressMsgId = addMessage({ role: "assistant", content: "", type: "build" });
    await streamText(progressMsgId, "⚡ **Orchestrator** is planning the website build for **" + name + "**...", 8);

    try {
      const startTime = Date.now();

      // Route through the Orchestrator
      const { data, error } = await supabase.functions.invoke("orchestrate", {
        body: {
          task: `Build a complete website for "${name}" — a ${ind} business. ${description}. Use the build_website skill to generate the full website.`,
          context: `Client: ${name}, Industry: ${ind}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Mark orchestrator complete
      setAgentStatus("Orchestrator", "complete", data.plan?.summary || "Plan created");

      // Extract website data from the orchestrator results
      let websiteResult: any = null;
      const orchestratorAgents: AgentLog[] = [
        { name: "Orchestrator", icon: "zap", status: "complete", description: data.plan?.summary || "Plan created", startedAt: startTime, completedAt: Date.now() },
      ];

      for (const step of (data.results || [])) {
        orchestratorAgents.push({
          name: step.agent_name,
          icon: "bot",
          status: step.error ? "error" : "complete",
          description: step.task?.slice(0, 80),
          output: step.result?.slice(0, 300),
          startedAt: startTime,
          completedAt: Date.now(),
        });

        // Try to parse website build result
        if (!step.error && step.result) {
          try {
            // The result may contain JSON from the build_website skill
            const jsonMatch = step.result.match(/\{[\s\S]*"_type"\s*:\s*"website_build"[\s\S]*\}/);
            if (jsonMatch) {
              websiteResult = JSON.parse(jsonMatch[0]);
            }
            // Also check if the skill result is embedded as a string
            if (!websiteResult && step.skills_used?.includes("build_website")) {
              const skillBlock = step.result.match(/\*\*Skill Used: build_website\*\*\n([\s\S]+?)(?=\n\*\*Skill|$)/);
              if (skillBlock) {
                try { websiteResult = JSON.parse(skillBlock[1].trim()); } catch {}
              }
            }
          } catch {}
        }
      }

      setCurrentAgentLogs(orchestratorAgents);

      if (websiteResult?.code) {
        setWebsiteCode(websiteResult.code);
        setWebsiteDesign(websiteResult.design || {});
        setWebsiteResearch(websiteResult.research || null);
        setWebsiteContent(websiteResult.content || null);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const finalContent = `✅ **Website built for ${name}** via Orchestrator in ${elapsed}s!\n\n**Plan**: ${data.plan?.summary}\n\nAgents used: ${orchestratorAgents.map(a => a.name).join(", ")}\n- 🎨 **Design**: ${websiteResult.design?.style || "modern"} style\n- 💻 **Code**: ${(websiteResult.code.length / 1024).toFixed(1)}KB React + Tailwind\n\nYou can now **edit** by chatting or **review** for improvements.`;
        await streamText(progressMsgId, finalContent, 6);
        updateMessage(progressMsgId, { agentLogs: orchestratorAgents });

        handleImproveReview(websiteResult.code, websiteResult.design, name, ind);
      } else {
        // Orchestrator ran but no website code — show the results anyway
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const resultsSummary = (data.results || []).map((r: any) => `- **${r.agent_name}**: ${r.result?.slice(0, 200)}`).join("\n");
        const finalContent = `⚡ **Orchestrator completed** in ${elapsed}s\n\n**Plan**: ${data.plan?.summary}\n\n${resultsSummary}\n\n⚠️ No website code was generated. Try: *"Build a website for ${name}, a ${ind} company"*`;
        await streamText(progressMsgId, finalContent, 6);
        updateMessage(progressMsgId, { agentLogs: orchestratorAgents });
      }
    } catch (err: any) {
      setCurrentAgentLogs(prev => prev.map(a => a.status === "running" || a.status === "idle" ? { ...a, status: "error" as const } : a));
      updateMessage(progressMsgId, { content: `❌ **Build failed**: ${err.message}` });
      setStreamingMessageId(null);
      toast.error(err.message || "Build failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Edit Website ──────────────────────────────────────────
  const handleEdit = async (instructions: string) => {
    if (!websiteCode) {
      addMessage({ role: "assistant", content: "No website to edit yet. Tell me what to build first!", type: "info" });
      setIsProcessing(false);
      return;
    }

    const editAgents: AgentLog[] = [
      { name: "Orchestrator", icon: "zap", status: "running", description: "Planning edit", startedAt: Date.now() },
      { name: "Website Builder", icon: "globe", status: "idle", description: "Applying edits", startedAt: Date.now() },
    ];
    setCurrentAgentLogs(editAgents);

    const editMsgId = addMessage({ role: "assistant", content: "", type: "edit" });
    await streamText(editMsgId, "⚡ **Orchestrator** is routing your edit: *" + instructions.slice(0, 80) + "*...", 8);

    try {
      const { data, error } = await supabase.functions.invoke("orchestrate", {
        body: {
          task: `Edit the current website for "${clientName}". Instructions: ${instructions}. Use the edit_website skill with the provided current code.`,
          context: `Client: ${clientName}, Industry: ${industry}. CURRENT_WEBSITE_CODE_LENGTH: ${websiteCode.length} chars. Pass the current code to the edit_website skill. Current code:\n${websiteCode.slice(0, 8000)}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAgentStatus("Orchestrator", "complete", data.plan?.summary);

      // Extract edited code from results
      let editedCode: string | null = null;
      for (const step of (data.results || [])) {
        if (!step.error && step.result) {
          try {
            const jsonMatch = step.result.match(/\{[\s\S]*"_type"\s*:\s*"website_edit"[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.code) editedCode = parsed.code;
            }
          } catch {}
        }
      }

      if (editedCode) {
        setWebsiteCode(editedCode);
        setCurrentAgentLogs(editAgents.map(a => ({ ...a, status: "complete" as const, completedAt: Date.now() })));
        await streamText(editMsgId, `✅ **Edit applied via Orchestrator!** The preview has been updated.\n\nKeep going — tell me what else to change.`, 6);
      } else {
        // Fallback: show orchestrator results
        const resultsSummary = (data.results || []).map((r: any) => r.result?.slice(0, 200)).join("\n");
        setCurrentAgentLogs(editAgents.map(a => ({ ...a, status: "complete" as const, completedAt: Date.now() })));
        await streamText(editMsgId, `⚡ **Orchestrator completed** but no code changes were applied.\n\n${resultsSummary}\n\nTry being more specific about the edit.`, 6);
      }
    } catch (err: any) {
      setCurrentAgentLogs(prev => prev.map(a => a.status === "running" || a.status === "idle" ? { ...a, status: "error" as const } : a));
      updateMessage(editMsgId, { content: `❌ **Edit failed**: ${err.message}` });
      setStreamingMessageId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Improve Review ────────────────────────────────────────
  const handleImproveReview = async (code?: string, design?: any, name?: string, ind?: string) => {
    const codeToReview = code || websiteCode;
    if (!codeToReview) return;

    const reviewAgents: AgentLog[] = [
      { name: "Authenticity Guard", icon: "shield", status: "running", description: "Detecting AI slop & clichés", startedAt: Date.now() },
      { name: "UX Reviewer", icon: "layout", status: "running", description: "Checking usability & design", startedAt: Date.now() },
      { name: "SEO Optimizer", icon: "search", status: "running", description: "Analyzing search optimization", startedAt: Date.now() },
      { name: "Performance Auditor", icon: "gauge", status: "running", description: "Checking code performance", startedAt: Date.now() },
    ];
    setCurrentAgentLogs(prev => [...prev, ...reviewAgents]);

    try {
      const { data, error } = await supabase.functions.invoke("improve-website", {
        body: { code: codeToReview, design: design || websiteDesign, clientName: name || clientName, industry: ind || industry },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Review failed");

      reviewAgents.forEach(a => setAgentStatus(a.name, "complete"));

      const mapped = (data.suggestions || []).map((s: any) => ({ ...s, status: "pending" as const }));
      setSuggestions(mapped);

      const criticalCount = mapped.filter((s: Suggestion) => s.severity === "critical").length;
      addMessage({
        role: "assistant",
        content: `🔍 **Review complete!** Found **${mapped.length}** suggestions${criticalCount > 0 ? ` (${criticalCount} critical)` : ""}.\n\nCheck the suggestions panel below the preview. You can apply them one by one or tell me *"apply all suggestions"*.`,
        type: "improve",
      });
    } catch (err: any) {
      reviewAgents.forEach(a => setAgentStatus(a.name, "error"));
    }
  };

  // ─── Apply Suggestion ──────────────────────────────────────
  const handleApplySuggestion = async (suggestion: Suggestion) => {
    if (!websiteCode) return;
    setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: "applying" as const } : s));

    try {
      const { data, error } = await supabase.functions.invoke("improve-website", {
        body: { mode: "apply-fix", code: websiteCode, fixInstructions: suggestion.fix_instructions, design: websiteDesign, clientName },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Fix failed");

      setWebsiteCode(data.code);
      setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: "applied" as const } : s));
      toast.success(`Applied: ${suggestion.title}`);
    } catch (err: any) {
      setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: "pending" as const } : s));
      toast.error(err.message || "Failed to apply");
    }
  };

  // ─── Send Message ──────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    setInput("");
    addMessage({ role: "user", content: text, type: "info" });
    setIsProcessing(true);

    const intent = parseUserIntent(text);

    if (intent.type === "build") {
      const name = intent.clientName || "My Business";
      const ind = intent.industry || "General";
      // Extract more description from the full message
      await handleBuild(name, ind, text);
    } else if (intent.type === "improve") {
      await handleImproveReview();
      setIsProcessing(false);
    } else {
      // Edit
      await handleEdit(text);
    }
  };

  // ─── Save / Load ──────────────────────────────────────────
  const handleSave = async () => {
    if (!websiteCode || !clientName.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        client_name: clientName, industry, html: websiteCode, design: websiteDesign,
        research: websiteResearch, content: websiteContent, pages: ["Home", "About", "Services", "Contact"],
        created_by: user?.id || null, updated_at: new Date().toISOString(),
      };
      if (currentWebsiteId) {
        await supabase.from("generated_websites").update(payload).eq("id", currentWebsiteId);
        toast.success("Website updated!");
      } else {
        const { data } = await supabase.from("generated_websites").insert(payload).select("id").single();
        if (data) setCurrentWebsiteId(data.id);
        toast.success("Website saved!");
      }
      const { data: refreshed } = await supabase.from("generated_websites").select("id, client_name, industry, created_at").order("created_at", { ascending: false }).limit(30);
      if (refreshed) setSavedWebsites(refreshed);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const { data, error } = await supabase.from("generated_websites").select("*").eq("id", id).single();
      if (error) throw error;
      setClientName(data.client_name);
      setIndustry(data.industry || "");
      setWebsiteCode(data.html);
      setWebsiteDesign(data.design);
      setWebsiteResearch(data.research);
      setWebsiteContent(data.content);
      setCurrentWebsiteId(data.id);
      setShowSaved(false);
      addMessage({ role: "assistant", content: `📂 Loaded **"${data.client_name}"** website. You can now edit it by chatting.`, type: "info" });
    } catch {
      toast.error("Failed to load");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("generated_websites").delete().eq("id", id);
    setSavedWebsites(prev => prev.filter(w => w.id !== id));
    if (currentWebsiteId === id) setCurrentWebsiteId(null);
    toast.success("Deleted");
  };

  const downloadCode = () => {
    if (!websiteCode) return;
    const blob = new Blob([websiteCode], { type: "text/jsx" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clientName.toLowerCase().replace(/\s+/g, "-")}-website.jsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Agent Icon Helper ────────────────────────────────────
  const AgentIcon = ({ icon, className }: { icon: string; className?: string }) => {
    switch (icon) {
      case "search": return <Search className={className} />;
      case "palette": return <Palette className={className} />;
      case "code": return <FileCode className={className} />;
      case "file": return <FileCode className={className} />;
      case "shield": return <ShieldCheck className={className} />;
      case "layout": return <Layout className={className} />;
      case "gauge": return <Gauge className={className} />;
      default: return <Bot className={className} />;
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* ═══════ LEFT: Chat Panel ═══════ */}
      <div className="w-[420px] min-w-[340px] flex flex-col border-r border-border/50 bg-background">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Site Builder</h1>
              <p className="text-[10px] text-muted-foreground">Multi-agent website generator</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowSaved(!showSaved)}>
              <FolderOpen className="h-3.5 w-3.5" />
            </Button>
            {websiteCode && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={downloadCode}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Saved Websites Dropdown */}
        <AnimatePresence>
          {showSaved && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b border-border/30">
              <div className="p-3 space-y-2 max-h-[200px] overflow-auto bg-secondary/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Saved Websites</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowSaved(false)}><X className="h-3 w-3" /></Button>
                </div>
                {savedWebsites.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-3">No saved websites yet</p>
                ) : savedWebsites.map(w => (
                  <div key={w.id} onClick={() => handleLoad(w.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-secondary/50 ${currentWebsiteId === w.id ? "bg-primary/5 border border-primary/20" : ""}`}>
                    <Globe className="h-3 w-3 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{w.client_name}</p>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2 w-2" />{new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={e => { e.stopPropagation(); handleDelete(w.id); }}>
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role !== "user" && (
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2.5"
                    : "bg-secondary/40 rounded-2xl rounded-bl-md px-3.5 py-2.5"
                }`}>
                  <div className="text-[13px] leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-inherit">
                    <ReactMarkdown>{streamingMessageId === msg.id ? streamedContent : msg.content}</ReactMarkdown>
                    {streamingMessageId === msg.id && (
                      <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Live Agent Activity */}
            {isProcessing && currentAgentLogs.length > 0 && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                </div>
                <div className="bg-secondary/40 rounded-2xl rounded-bl-md px-3.5 py-2.5 w-full">
                  <p className="text-[11px] font-medium text-foreground mb-2">Agents working...</p>
                  <div className="space-y-1.5">
                    {currentAgentLogs.map(agent => (
                      <div key={agent.name} className={`flex items-center gap-2 text-[11px] ${agent.status === "idle" ? "opacity-40" : ""}`}>
                        {agent.status === "running" ? (
                          <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                        ) : agent.status === "complete" ? (
                          <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        ) : agent.status === "idle" ? (
                          <div className="h-3 w-3 rounded-full border border-muted-foreground/30 shrink-0" />
                        ) : (
                          <X className="h-3 w-3 text-destructive shrink-0" />
                        )}
                        <span className={agent.status === "complete" ? "text-muted-foreground" : agent.status === "idle" ? "text-muted-foreground/60" : "text-foreground"}>
                          {agent.name}
                        </span>
                        {agent.status === "running" && (
                          <span className="text-muted-foreground/50 ml-auto">working...</span>
                        )}
                        {agent.status === "idle" && (
                          <span className="text-muted-foreground/30 ml-auto">waiting</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-3 border-t border-border/30">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={websiteCode ? "Describe changes... or type 'improve' to review" : "Build a website for [name], a [industry] company..."}
              className="bg-secondary/30 border-border/30 rounded-xl pr-12 min-h-[52px] max-h-[120px] resize-none text-[13px]"
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isProcessing}
            />
            <Button
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg"
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ═══════ RIGHT: Preview + Agent Logs ═══════ */}
      <div className="flex-1 flex flex-col bg-muted/10 min-w-0">
        {websiteCode ? (
          <>
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center bg-secondary/30 rounded-lg p-0.5">
                  <button onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === "code" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    <Code className="h-3 w-3" /> Code
                  </button>
                </div>

                {/* Device toggle */}
                {viewMode === "preview" && (
                  <div className="flex items-center gap-0.5 ml-2">
                    {(Object.entries(DEVICE_SIZES) as [PreviewDevice, typeof DEVICE_SIZES["desktop"]][]).map(([key, device]) => (
                      <button key={key} onClick={() => setPreviewDevice(key)}
                        className={`p-1.5 rounded-md transition-all ${previewDevice === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title={device.label}>
                        <device.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[9px] h-5">
                  {clientName} • {industry}
                </Badge>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowAgentPanel(!showAgentPanel)}>
                  {showAgentPanel ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 min-w-0">
                {viewMode === "preview" ? (
                  <div className="h-full flex items-start justify-center overflow-auto bg-muted/20 p-4">
                    <div className="transition-all duration-300 ease-in-out bg-white rounded-lg shadow-lg overflow-hidden"
                      style={{
                        width: DEVICE_SIZES[previewDevice].width,
                        maxWidth: "100%",
                        height: previewDevice === "desktop" ? "100%" : "640px",
                        ...(previewDevice !== "desktop" && { border: "8px solid hsl(var(--border))", borderRadius: "20px" }),
                      }}>
                      <iframe ref={iframeRef} srcDoc={buildPreviewHtml(websiteCode, websiteDesign)}
                        className="w-full h-full border-0 bg-white" title="Website Preview" sandbox="allow-scripts" />
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground font-mono">{(websiteCode.length / 1024).toFixed(1)}KB React + Tailwind</span>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { navigator.clipboard.writeText(websiteCode); toast.success("Copied!"); }}>
                          Copy
                        </Button>
                      </div>
                      <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                        {websiteCode}
                      </pre>
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Agent Logs Panel */}
              <AnimatePresence>
                {showAgentPanel && (
                  <motion.div initial={{ width: 0 }} animate={{ width: 280 }} exit={{ width: 0 }}
                    className="border-l border-border/30 bg-background overflow-hidden shrink-0">
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-3">
                        <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Agent Activity</h3>

                        {/* Current/last agent logs */}
                        {currentAgentLogs.map(agent => (
                          <AgentLogCard key={agent.name} agent={agent} AgentIcon={AgentIcon} />
                        ))}

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/30">
                            <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Wand2 className="h-3 w-3" /> Suggestions ({suggestions.length})
                            </h4>
                            {suggestions.map(s => (
                              <div key={s.id} className={`p-2.5 rounded-lg border text-[11px] transition-all ${
                                s.status === "applied" ? "border-success/20 bg-success/5 opacity-60" :
                                s.status === "rejected" ? "opacity-30" :
                                s.status === "applying" ? "border-primary/20 bg-primary/5" :
                                "border-border/30 bg-secondary/10"
                              }`}>
                                <div className="flex items-start gap-1.5">
                                  <Badge variant="outline" className="text-[8px] h-4 px-1 shrink-0 mt-0.5">
                                    {s.category === "authenticity" ? "Anti-Slop" : s.category.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium">{s.title}</span>
                                </div>
                                <p className="text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                                {s.status === "pending" && (
                                  <div className="flex gap-1 mt-1.5">
                                    <Button size="sm" className="h-5 text-[9px] px-2 rounded-md" onClick={() => handleApplySuggestion(s)}>
                                      Apply
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-5 text-[9px] px-2 rounded-md"
                                      onClick={() => setSuggestions(prev => prev.map(x => x.id === s.id ? { ...x, status: "rejected" } : x))}>
                                      Skip
                                    </Button>
                                  </div>
                                )}
                                {s.status === "applied" && (
                                  <div className="flex items-center gap-1 mt-1 text-success text-[9px]">
                                    <CheckCircle2 className="h-2.5 w-2.5" /> Applied
                                  </div>
                                )}
                                {s.status === "applying" && (
                                  <div className="flex items-center gap-1 mt-1 text-primary text-[9px]">
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Applying...
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">No website yet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe what you want to build in the chat. Our multi-agent system will research, write, design, and code a complete website.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Build a website for a coffee roastery",
                  "Create a law firm landing page",
                  "Design a SaaS product site",
                ].map(prompt => (
                  <button key={prompt} onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agent Log Card ──────────────────────────────────────────
function AgentLogCard({ agent, AgentIcon }: { agent: AgentLog; AgentIcon: any }) {
  const [expanded, setExpanded] = useState(false);
  const duration = agent.completedAt ? ((agent.completedAt - agent.startedAt) / 1000).toFixed(1) : null;

  return (
    <div className={`rounded-lg border p-2.5 transition-all ${
      agent.status === "running" ? "border-primary/20 bg-primary/5" :
      agent.status === "complete" ? "border-border/20 bg-secondary/10" :
      "border-destructive/20 bg-destructive/5"
    }`}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => agent.output && setExpanded(!expanded)}>
        {agent.status === "running" ? (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        ) : agent.status === "complete" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
        ) : (
          <X className="h-3.5 w-3.5 text-destructive shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground">{agent.name}</p>
          <p className="text-[9px] text-muted-foreground truncate">{agent.description}</p>
        </div>
        {duration && <span className="text-[9px] text-muted-foreground/60 shrink-0">{duration}s</span>}
        {agent.output && (
          expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </div>
      <AnimatePresence>
        {expanded && agent.output && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <pre className="text-[9px] text-muted-foreground mt-2 p-2 bg-background/50 rounded-md whitespace-pre-wrap break-words max-h-[200px] overflow-auto font-mono leading-relaxed">
              {agent.output}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
