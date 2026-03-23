import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell, RunAutomationsButton } from "@/components/NotificationBell";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, House, Bot, Briefcase, Mail, Settings } from "lucide-react";
import { ardenoTransitions, buttonMotion, navIndicatorMotion } from "@/lib/motion";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/intelligence": "Intelligence",
  "/orchestrate": "Orchestrator",
  "/chat": "Agent Chat",
  "/projects": "Projects",
  "/leads": "Lead Engine",
  "/proposals": "Proposals",
  "/invoices": "Invoices",
  "/outreach": "Outreach",
  "/analyzer": "Website Analyzer",
  "/gmail": "Gmail",
  "/tasks": "Tasks",
  "/analytics": "Analytics",
  "/pipeline": "Pipeline",
  "/assets": "Assets",
  "/agents": "Agent Manager",
  "/mirofish": "Parallel Society",
  "/settings": "Settings",
};

const PAGE_SUMMARIES: Record<string, string> = {
  "/": "Monitor execution, revenue, agents, and operating signals in one command surface.",
  "/intelligence": "Turn operational data into actionable insight across Ardeno Studio.",
  "/orchestrate": "Coordinate specialist agents with premium oversight and control.",
  "/chat": "Work directly with your AI team across shared business context.",
  "/projects": "Track client delivery, milestones, and execution momentum.",
  "/agents": "Shape your internal agent roster, prompts, and capabilities.",
  "/mirofish": "Access the 300+ agents in MiroFish for high-stakes simulations and market forecasting.",
};

export function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Ardeno OS";
  const summary = PAGE_SUMMARIES[location.pathname] || "Ardeno Studio operating system";
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "A").toUpperCase();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator";

  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <SidebarProvider>
      <div className="ardeno-shell page-atmosphere flex min-h-screen w-full">
        <AppSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="light-beam opacity-40" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 grid-overlay opacity-40" />
          <header className="premium-topbar sticky top-0 z-30 shrink-0 border-b border-white/8 px-4 py-3 md:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <SidebarTrigger className="shell-icon-button mt-1 h-10 w-10" />
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    <span>Ardeno Studio</span>
                    <span className="text-white/15">/</span>
                    <span className="text-primary">OS</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-[clamp(1.8rem,2.1vw,2.35rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-foreground">
                      {title}
                    </h1>
                    <span className="brand-chip hidden md:inline-flex">Operational Surface</span>
                  </div>
                  <p className="page-summary mt-1 max-w-[36rem]">{summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  onClick={openCommandPalette}
                  className="command-trigger group hidden items-center gap-3 md:flex"
                  {...buttonMotion}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/8 bg-black/20">
                    <Search className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Search workspace</div>
                    <div className="text-xs text-muted-foreground">Jump to pages, agents, and tools</div>
                  </div>
                  <kbd className="rounded-[10px] border border-white/10 bg-black/20 px-2.5 py-1 font-data text-[10px] text-muted-foreground">
                    ⌘K
                  </kbd>
                </motion.button>

                <RunAutomationsButton />
                <NotificationBell />

                <motion.div className="brand-ring hidden items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 md:flex" initial={navIndicatorMotion.initial} animate={navIndicatorMotion.animate}>
                  <div className="relative h-2 w-2 rounded-full bg-success">
                    <div className="status-active absolute inset-0 rounded-full bg-success" />
                  </div>
                  <span className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Online</span>
                </motion.div>

                <div className="ml-1 flex items-center gap-3 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="hidden text-right md:block">
                    <div className="text-[13px] font-medium leading-none text-foreground">{firstName}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">Ardeno Studio</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-black/30">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-foreground">{initials}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={ardenoTransitions.fast}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <CommandPalette />
      </div>

      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}

function MobileNav() {
  const location = useLocation();
  const items = [
    { icon: House, url: "/", label: "Home" },
    { icon: Bot, url: "/chat", label: "Agents" },
    { icon: Briefcase, url: "/projects", label: "Projects" },
    { icon: Mail, url: "/gmail", label: "Inbox" },
    { icon: Settings, url: "/settings", label: "Settings" },
  ];

  return (
    <div className="ardeno-panel mx-auto flex max-w-md items-center justify-around rounded-[24px] px-2 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.url;

        return (
          <Link
            key={item.url}
            to={item.url}
            className={`relative flex min-w-[60px] flex-col items-center gap-1 rounded-[16px] px-3 py-2 transition-all duration-200 ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {active ? (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute inset-0 rounded-[16px] border border-primary/20 bg-[linear-gradient(180deg,rgba(255,79,0,0.16),rgba(255,79,0,0.08))]"
                transition={ardenoTransitions.fast}
              />
            ) : null}
            <Icon className="relative z-[1] h-5 w-5" />
            <span className="relative z-[1] text-[10px] font-medium uppercase tracking-[0.12em]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
