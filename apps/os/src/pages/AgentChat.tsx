import { useState, useRef, useEffect, useCallback } from "react";
import {
  AGENT_CATALOG,
  DEPT_META,
  CATALOG_DEPT_ORDER,
  type AgentDept,
} from "@/lib/agents";
import { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Send, Copy, Save, Bot, Clock, Cpu,
  PanelLeftOpen, Search, ChevronDown, ChevronRight,
} from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { ArdenoEmptyState } from "@/components/ui/ardeno-empty-state";
import { ardenoTransitions, buttonMotion, cardHoverMotion, pageVariants } from "@/lib/motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatAgent {
  id:           string;
  name:         string;
  subtitle:     string;
  provider:     string;
  model:        string;
  systemPrompt: string;
  enabled:      boolean;
  dept?:        AgentDept;
  isCustom?:    boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

const OPENROUTER_FREE_MODELS = [
  { id: "deepseek/deepseek-r1:free",                     label: "DeepSeek R1" },
  { id: "qwen/qwen3-32b:free",                           label: "Qwen3 32B" },
  { id: "meta-llama/llama-4-maverick:free",              label: "Llama 4 Maverick" },
  { id: "google/gemini-2.5-flash:free",                  label: "Gemini Flash (Free)" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small" },
];

// Map the full AGENT_CATALOG to ChatAgent[]
const BASE_AGENTS: ChatAgent[] = AGENT_CATALOG
  .filter(a => a.enabled)
  .map(a => ({
    id:           a.id,
    name:         a.name,
    subtitle:     a.description,
    provider:     a.provider,
    model:        a.model,
    systemPrompt: a.systemPrompt,
    enabled:      a.enabled,
    dept:         a.dept,
    isCustom:     false,
  }));

// ─── Streaming helper ─────────────────────────────────────────────────────────
async function streamAgentChat({
  agentId,
  messages,
  conversationId,
  systemPrompt,
  provider,
  model,
  onDelta,
  onDone,
  onError,
}: {
  agentId:        string;
  messages:       { role: string; content: string }[];
  conversationId: string;
  systemPrompt:   string;
  provider?:      string;
  model?:         string;
  onDelta:  (text: string) => void;
  onDone:   () => void;
  onError:  (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      agent_id:        agentId,
      messages,
      conversation_id: conversationId,
      system_prompt:   systemPrompt,
      ...(provider && { provider }),
      ...(model    && { model }),
    }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: "Unknown error" }));
    onError(body.error || `Error ${resp.status}`);
    return;
  }
  if (!resp.body) { onError("No response body"); return; }

  const reader  = resp.body.getReader();
  const decoder = new TextDecoder();
  let   textBuf = "";
  let   done    = false;

  while (!done) {
    const { done: eof, value } = await reader.read();
    if (eof) break;
    textBuf += decoder.decode(value, { stream: true });

    let nlIdx: number;
    while ((nlIdx = textBuf.indexOf("\n")) !== -1) {
      let line = textBuf.slice(0, nlIdx);
      textBuf  = textBuf.slice(nlIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim()) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed  = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuf = line + "\n" + textBuf;
        break;
      }
    }
  }

  // Flush remaining buffer
  for (let raw of textBuf.split("\n")) {
    if (!raw) continue;
    if (raw.endsWith("\r")) raw = raw.slice(0, -1);
    if (raw.startsWith(":") || !raw.trim()) continue;
    if (!raw.startsWith("data: ")) continue;
    const json = raw.slice(6).trim();
    if (json === "[DONE]") continue;
    try {
      const parsed  = JSON.parse(json);
      const content = parsed.choices?.[0]?.delta?.content as string | undefined;
      if (content) onDelta(content);
    } catch { /* ignore */ }
  }
  onDone();
}

function generateId() { return crypto.randomUUID(); }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AgentChat() {
  const [chatAgents,     setChatAgents]     = useState<ChatAgent[]>(BASE_AGENTS);
  const [selectedAgent,  setSelectedAgent]  = useState<ChatAgent>(BASE_AGENTS[0]);
  const [conversations,  setConversations]  = useState<Record<string, ChatMessage[]>>({});
  const [conversationIds,setConversationIds]= useState<Record<string, string>>({});
  const [input,          setInput]          = useState("");
  const [useOpenRouter,  setUseOpenRouter]  = useState(false);
  const [openRouterModel,setOpenRouterModel]= useState(OPENROUTER_FREE_MODELS[0].id);
  const [isLoading,      setIsLoading]      = useState(false);
  const [search,         setSearch]         = useState("");
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages  = conversations[selectedAgent.id] || [];

  // Load custom agents from DB and append to catalog agents
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("custom_agents")
        .select("*")
        .eq("enabled", true);
      if (data && data.length > 0) {
        const custom: ChatAgent[] = (data as any[]).map(ca => ({
          id:           ca.agent_id,
          name:         ca.name,
          subtitle:     ca.role || ca.system_prompt.slice(0, 80),
          provider:     ca.provider,
          model:        ca.model,
          systemPrompt: ca.system_prompt,
          enabled:      true,
          isCustom:     true,
        }));
        setChatAgents([...BASE_AGENTS, ...custom]);
      }
    })();
  }, []);

  // Load latest saved conversation per agent
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("agent_conversations")
        .select("id, agent_id, messages")
        .order("created_at", { ascending: false });
      if (!data) return;
      const convMap: Record<string, ChatMessage[]> = {};
      const idMap:   Record<string, string>        = {};
      for (const row of data) {
        if (
          !convMap[row.agent_id] &&
          Array.isArray(row.messages) &&
          (row.messages as any[]).length > 0
        ) {
          convMap[row.agent_id] = row.messages as unknown as ChatMessage[];
          idMap[row.agent_id]   = row.id;
        }
      }
      setConversations(convMap);
      setConversationIds(idMap);
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const getConversationId = useCallback((agentId: string) => {
    if (conversationIds[agentId]) return conversationIds[agentId];
    const id = generateId();
    setConversationIds(prev => ({ ...prev, [agentId]: id }));
    return id;
  }, [conversationIds]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      role:      "user",
      content:   input.trim(),
      timestamp: new Date().toISOString(),
    };
    const current = [...(conversations[selectedAgent.id] || []), userMsg];
    setConversations(p => ({ ...p, [selectedAgent.id]: current }));
    setInput("");
    setIsLoading(true);
    const convId    = getConversationId(selectedAgent.id);
    const startTime = Date.now();
    let   assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setConversations(prev => {
        const msgs = prev[selectedAgent.id] || [];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant" && !last.timestamp) {
          return {
            ...prev,
            [selectedAgent.id]: msgs.map((m, i) =>
              i === msgs.length - 1 ? { ...m, content: assistantSoFar } : m
            ),
          };
        }
        return {
          ...prev,
          [selectedAgent.id]: [...msgs, { role: "assistant" as const, content: assistantSoFar }],
        };
      });
    };

    try {
      await streamAgentChat({
        agentId:      selectedAgent.id,
        messages:     current.map(m => ({ role: m.role, content: m.content })),
        conversationId: convId,
        systemPrompt: selectedAgent.systemPrompt,
        provider:     useOpenRouter ? "openrouter" : undefined,
        model:        useOpenRouter ? openRouterModel : undefined,
        onDelta:      upsertAssistant,
        onDone: () => {
          const responseTime = Date.now() - startTime;
          setConversations(prev => {
            const msgs      = prev[selectedAgent.id] || [];
            const finalMsgs = msgs.map((m, i) => {
              if (i === msgs.length - 1 && m.role === "assistant") {
                return {
                  ...m,
                  timestamp:    new Date().toISOString(),
                  model:        useOpenRouter
                    ? openRouterModel.split("/").pop()?.replace(":free", "") || "openrouter"
                    : selectedAgent.model,
                  responseTime,
                };
              }
              return m;
            });
            supabase.from("agent_conversations").upsert({
              id:       convId,
              agent_id: selectedAgent.id,
              messages: finalMsgs as any,
            } as any).then(() => {});
            return { ...prev, [selectedAgent.id]: finalMsgs };
          });
          setIsLoading(false);
        },
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Failed to connect to agent");
      setIsLoading(false);
    }
  };

  const toggleDept = (dept: string) =>
    setCollapsedDepts(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept); else next.add(dept);
      return next;
    });

  // ─── Agent sidebar button ──────────────────────────────────────────────────
  const AgentButton = ({
    agent,
    onSelect,
  }: {
    agent:     ChatAgent;
    onSelect?: () => void;
  }) => (
    <button
      onClick={() => { setSelectedAgent(agent); onSelect?.(); }}
      className={`surface-list-item w-full text-left ${
        selectedAgent.id === agent.id
          ? "border-primary/20 bg-[linear-gradient(180deg,rgba(255,79,0,0.14),rgba(255,79,0,0.07))] text-foreground shadow-[0_18px_42px_-30px_rgba(255,79,0,0.7)]"
          : "text-muted-foreground"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="mt-0.5 h-2 w-2 rounded-full shrink-0 bg-[hsl(var(--success))] status-pulse" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-inherit">{agent.name}</p>
          <p className="truncate font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            {agent.provider} · {agent.model.split("/").pop()?.replace(":free", "")}
          </p>
        </div>
      </div>
    </button>
  );

  // ─── Grouped + searchable sidebar ─────────────────────────────────────────
  const AgentList = ({ onSelect }: { onSelect?: () => void }) => {
    const lower    = search.toLowerCase();
    const filtered = chatAgents.filter(a =>
      a.enabled && (!lower || a.name.toLowerCase().includes(lower) || a.subtitle.toLowerCase().includes(lower))
    );
    const customAgents = filtered.filter(a => a.isCustom);
    const grouped      = CATALOG_DEPT_ORDER
      .map(dept => ({
        dept,
        meta:   DEPT_META[dept],
        agents: filtered.filter(a => !a.isCustom && a.dept === dept),
      }))
      .filter(g => g.agents.length > 0);

    return (
      <div className="p-3 space-y-1">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents…"
            className="w-full rounded-[12px] border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-white/15"
          />
        </div>

        {/* Custom agents */}
        {customAgents.length > 0 && (
          <div className="mb-1">
            <div className="px-2 mb-1 font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
              Custom
            </div>
            {customAgents.map(a => <AgentButton key={a.id} agent={a} onSelect={onSelect} />)}
          </div>
        )}

        {/* Dept groups */}
        {grouped.map(({ dept, meta, agents }) => {
          const collapsed = collapsedDepts.has(dept);
          const Icon      = meta.icon;
          return (
            <div key={dept}>
              <button
                onClick={() => toggleDept(dept)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-white/[0.03] transition-colors"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="flex-1 text-left text-[11px] font-medium text-muted-foreground truncate">
                  {meta.label}
                </span>
                <span className="font-data text-[10px] text-muted-foreground/40 shrink-0">
                  {agents.length}
                </span>
                {collapsed
                  ? <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  : <ChevronDown  className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                }
              </button>
              {!collapsed && agents.map(a =>
                <AgentButton key={a.id} agent={a} onSelect={onSelect} />
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[12px] text-muted-foreground/50">
            No agents match "{search}"
          </p>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden" animate="show" variants={pageVariants}
      className="page-atmosphere flex h-[calc(100vh-3.5rem)] overflow-hidden"
    >
      {/* Desktop sidebar */}
      <div className="hidden w-72 shrink-0 overflow-auto border-r border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] backdrop-blur-xl md:block">
        <AgentList />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/50 px-5 py-4 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-card">
                <ScrollArea className="h-full">
                  <AgentList onSelect={() => {}} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] border border-primary/18 bg-primary/10 shrink-0 ${isLoading ? "animate-pulse" : ""}`}>
              <Bot className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-medium text-foreground">
                  {selectedAgent.name}
                </span>
                <span className="pill-label border-white/8 bg-white/[0.03] text-muted-foreground">
                  {useOpenRouter ? "OpenRouter" : selectedAgent.provider}
                  {" · "}
                  {useOpenRouter
                    ? openRouterModel.split("/").pop()?.replace(":free", "")
                    : selectedAgent.model.split("/").pop()?.replace(":free", "")
                  }
                </span>
              </div>
              <p className="mt-1 max-w-2xl truncate text-[13px] text-muted-foreground">
                {selectedAgent.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-5 md:p-8 space-y-5">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <ArdenoEmptyState
                icon={Bot}
                title={`Start a conversation with ${selectedAgent.name}`}
                description={selectedAgent.subtitle || "Use Ardeno OS as a direct operating channel into your AI workforce."}
                className="w-full max-w-xl"
              />
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ardenoTransitions.fast}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                <motion.div
                  {...(msg.role === "assistant" ? cardHoverMotion : {})}
                  className={`max-w-[85%] md:max-w-[70%] ${
                    msg.role === "user"
                      ? "ardeno-panel rounded-[22px] rounded-br-[10px] px-5 py-3.5"
                      : "glass-card orange-glow-soft rounded-[22px] rounded-bl-[10px] border-l-2 border-l-primary px-5 py-3.5"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-2 font-data text-[10px] uppercase tracking-[0.16em] text-primary">
                      {selectedAgent.name}
                    </div>
                  )}
                  <div className="prose prose-sm prose-invert max-w-none text-[14px] leading-7 text-foreground/90 [&_li]:text-foreground/90 [&_p]:text-foreground/90 [&_strong]:text-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.role === "assistant" && msg.timestamp && (
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/30">
                      <span className="text-[10px] font-data text-muted-foreground flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {msg.model || selectedAgent.model.split("/").pop()?.replace(":free", "")}
                      </span>
                      {msg.responseTime && (
                        <span className="text-[10px] font-data text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {msg.responseTime}ms
                        </span>
                      )}
                      <div className="ml-auto flex gap-2">
                        <motion.button
                          {...buttonMotion}
                          onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied"); }}
                          className="shell-icon-button h-7 w-7 rounded-[10px]"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </motion.button>
                        <motion.button
                          {...buttonMotion}
                          onClick={() => toast.success("Saved to project")}
                          className="shell-icon-button h-7 w-7 rounded-[10px]"
                        >
                          <Save className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="glass-card orange-glow-soft max-w-[70%] rounded-[22px] rounded-bl-[10px] border-l-2 border-l-primary px-5 py-3">
              <div className="mb-2 font-data text-[10px] uppercase tracking-[0.16em] text-primary">
                {selectedAgent.name}
              </div>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/60 status-pulse" />
                <span className="w-2 h-2 rounded-full bg-primary/60 status-pulse [animation-delay:0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 status-pulse [animation-delay:0.6s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border/50 bg-background/50 px-5 py-3 backdrop-blur-xl space-y-3">
          {/* Provider toggle */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setUseOpenRouter(false)}
              className={`interactive-pill rounded-full border px-3 py-1 text-[10px] font-data uppercase tracking-[0.14em] ${
                !useOpenRouter
                  ? "border-primary/18 bg-primary/12 text-primary"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground"
              }`}
            >
              Agent Default
            </button>
            <button
              onClick={() => setUseOpenRouter(true)}
              className={`interactive-pill rounded-full border px-3 py-1 text-[10px] font-data uppercase tracking-[0.14em] ${
                useOpenRouter
                  ? "border-primary/18 bg-primary/12 text-primary"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground"
              }`}
            >
              OpenRouter Override
            </button>
            {useOpenRouter && (
              <select
                value={openRouterModel}
                onChange={e => setOpenRouterModel(e.target.value)}
                className="ml-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-data uppercase tracking-[0.12em] text-foreground outline-none"
              >
                {OPENROUTER_FREE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Text input */}
          <div className="ardeno-panel focus-frame flex items-center gap-3 rounded-[18px] px-4 py-2.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder={`Message ${selectedAgent.name}…`}
              className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <VoiceInput onResult={text => setInput(prev => prev ? `${prev} ${text}` : text)} />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 rounded-[14px] orange-glow-soft"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
