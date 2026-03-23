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
  "/settings": "Configure your OS environment and agency preferences.",
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
      <div className="flex min-h-screen w-full bg-[#fbfbfb]">
        <AppSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-white/40 bg-white/60 backdrop-blur-xl px-4 py-4 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <SidebarTrigger className="h-10 w-10 rounded-xl bg-slate-100/50 hover:bg-slate-200/50 transition-colors" />
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <span>Ardeno Studio</span>
                    <span className="text-slate-200">/</span>
                    <span className="text-primary/70">OS</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-[clamp(1.8rem,2.1vw,2.4rem)] font-bold leading-none tracking-[-0.03em] text-slate-900">
                      {title}
                    </h1>
                  </div>
                  <p className="mt-2 max-w-[36rem] text-[13px] leading-relaxed text-slate-500 font-medium">{summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  onClick={openCommandPalette}
                  className="group hidden h-11 items-center gap-3 rounded-2xl border border-slate-200/50 bg-white/40 px-4 transition-all hover:bg-white/80 hover:shadow-sm md:flex"
                  {...buttonMotion}
                >
                  <Search className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-semibold text-slate-500">Search...</span>
                  <kbd className="rounded-lg bg-slate-100 px-2 py-0.5 font-data text-[10px] text-slate-400">
                    ⌘K
                  </kbd>
                </motion.button>

                <NotificationBell />

                <div className="flex h-11 items-center gap-3 rounded-2xl border border-white/60 bg-white/40 px-3 shadow-sm">
                  <div className="hidden text-right md:block">
                    <div className="text-[13px] font-bold text-slate-900">{firstName}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ardeno HQ</div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white bg-slate-100 shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{initials}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <CommandPalette />
      </div>

      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
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
    <div className="flex mx-auto max-w-md items-center justify-around rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl px-2 py-2 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.url;

        return (
          <Link
            key={item.url}
            to={item.url}
            className={`relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all duration-300 ${
              active ? "text-primary bg-primary/5" : "text-slate-400"
            }`}
          >
            <Icon className="relative z-[1] h-5 w-5" />
            <span className="relative z-[1] text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
