import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AGENTS } from "@/lib/agents";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArdenoMark } from "@/components/brand/ArdenoBrand";
import { buttonMotion, modalVariants, overlayVariants } from "@/lib/motion";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const items: CommandItem[] = [
    { id: "nav-dash", label: "Dashboard", category: "Navigate", action: () => navigate("/") },
    { id: "nav-intel", label: "Intelligence", category: "Navigate", action: () => navigate("/intelligence") },
    { id: "nav-orch", label: "Orchestrator", category: "Navigate", action: () => navigate("/orchestrate") },
    { id: "nav-chat", label: "Agent Chat", category: "Navigate", action: () => navigate("/chat") },
    { id: "nav-proj", label: "Projects", category: "Navigate", action: () => navigate("/projects") },
    { id: "nav-lead", label: "Lead Engine", category: "Navigate", action: () => navigate("/leads") },
    { id: "nav-prop", label: "Proposals", category: "Navigate", action: () => navigate("/proposals") },
    { id: "nav-inv", label: "Invoices", category: "Navigate", action: () => navigate("/invoices") },
    { id: "nav-out", label: "Outreach", category: "Navigate", action: () => navigate("/outreach") },
    { id: "nav-analyzer", label: "Website Analyzer", category: "Navigate", action: () => navigate("/analyzer") },
    { id: "nav-mail", label: "Gmail", category: "Navigate", action: () => navigate("/gmail") },
    { id: "nav-task", label: "Tasks", category: "Navigate", action: () => navigate("/tasks") },
    { id: "nav-analytics", label: "Analytics", category: "Navigate", action: () => navigate("/analytics") },
    { id: "nav-pipeline", label: "Pipeline", category: "Navigate", action: () => navigate("/pipeline") },
    { id: "nav-assets", label: "Assets", category: "Navigate", action: () => navigate("/assets") },
    { id: "nav-set", label: "Settings", category: "Navigate", action: () => navigate("/settings") },
    ...AGENTS.map((agent) => ({
      id: `agent-${agent.id}`,
      label: agent.name,
      category: "Agents",
      action: () => navigate("/chat"),
    })),
  ];

  const filtered = query
    ? items.filter((item) => {
        const haystack = `${item.label} ${item.category}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : items;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }

      if (!open) return;

      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => Math.min(index + 1, filtered.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setOpen(false);
      }
    },
    [filtered, open, selectedIndex],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]" onClick={() => setOpen(false)}>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 bg-[rgba(3,3,4,0.72)] backdrop-blur-xl"
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="ardeno-panel relative z-[1] w-full max-w-2xl overflow-hidden rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="light-beam opacity-50" />
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,79,0,0.14),transparent_58%)]" />
            <div className="relative border-b border-white/8 px-6 py-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ArdenoMark className="h-12 w-12 p-2.5" glow />
                  <div>
                    <div className="font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ardeno Command Bar</div>
                    <div className="font-display text-[clamp(1.25rem,1.8vw,1.55rem)] leading-[0.98] tracking-[-0.03em] text-foreground">Search the operating system</div>
                  </div>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:flex">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI Native Navigation
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/[0.04]">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search pages, agents, systems, or business operations..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/65 outline-none"
                />
                <kbd className="rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-1 font-data text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto px-2 py-3">
              {filtered.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="font-display text-lg text-foreground">No matching surfaces</p>
                  <p className="mt-2 text-sm text-muted-foreground">Try a page name, agent name, or workflow term.</p>
                </div>
              ) : null}

              {["Navigate", "Agents"].map((category) => {
                const categoryItems = filtered.filter((item) => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="mb-3">
                    <div className="px-4 py-2 font-data text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {category}
                    </div>
                    {categoryItems.map((item, index) => {
                      const globalIndex = filtered.indexOf(item);

                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => {
                            item.action();
                            setOpen(false);
                          }}
                          {...buttonMotion}
                          data-selected={globalIndex === selectedIndex}
                          className={`command-item ${
                            globalIndex === selectedIndex ? "text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.category}</div>
                          </div>
                          <ArrowRight className={`h-4 w-4 ${globalIndex === selectedIndex ? "text-primary" : "text-muted-foreground"}`} />
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-5 border-t border-white/8 px-6 py-4 font-data text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Close</span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
