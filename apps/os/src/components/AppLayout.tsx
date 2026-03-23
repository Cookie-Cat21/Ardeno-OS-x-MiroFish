import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, House, Bot, Globe, Zap, Settings, Bell } from "lucide-react";
import { ardenoTransitions, buttonMotion, navIndicatorMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "Command Center",
  "/intelligence": "Intelligence",
  "/orchestrate": "Parallel Logic",
  "/chat": "Agent Roster",
  "/mirofish": "The Society",
  "/settings": "OS Settings",
};

export function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Ardeno OS";
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "A").toUpperCase();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator";

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-[#fbfbfb] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AppSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* MINIMAL STICKY HEADER */}
          <header className="sticky top-0 z-30 shrink-0 px-6 py-6 md:px-12 md:py-8 pointer-events-none">
            <div className="flex items-center justify-between gap-4 pointer-events-auto">
              <div className="flex items-center gap-6">
                 <SidebarTrigger className="h-10 w-10 rounded-xl bg-white/40 border border-slate-200/50 backdrop-blur-md shadow-sm hover:bg-white/80 transition-all" />
                 <div className="hidden md:block">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="flex h-11 items-center gap-3 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl px-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)]">
                    <div className="text-right hidden sm:block">
                      <div className="text-[12px] font-bold text-slate-900">{firstName}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Ardeno HQ</div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 border border-white/50">
                        {avatarUrl ? <img src={avatarUrl} className="rounded-lg" /> : initials}
                    </div>
                 </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-6 md:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* THE SENTIENT DOCK (FLOATING GLOBAL NAV) */}
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
           <SentientDock />
        </div>

        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}

function SentientDock() {
  const location = useLocation();
  const { state } = useAuth(); // or check notifications
  
  const dockItems = [
    { icon: House, url: "/", label: "Home" },
    { icon: Globe, url: "/mirofish", label: "Society" },
    { icon: Bot, url: "/chat", label: "Agents" },
    { icon: Zap, url: "/orchestrate", label: "Logic" },
    { icon: Search, action: "search", label: "Search" },
    { icon: Settings, url: "/settings", label: "Setup" },
  ];

  const handleSearch = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center gap-1.5 p-2 rounded-[28px] border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/50"
    >
      {dockItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.url;
        
        const Component = item.url ? Link : "button";
        const props = item.url ? { to: item.url } : { onClick: handleSearch };

        return (
          <Component
            key={item.label}
            {...(props as any)}
            className={cn(
                "relative group flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                active ? "bg-primary text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-slate-100/80 hover:text-slate-900"
            )}
          >
            <Icon size={20} className="relative z-10" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.label}
            </div>
            {active && (
                <motion.div 
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-2xl bg-primary -z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
          </Component>
        );
      })}
      
      <div className="w-px h-6 bg-slate-200/60 mx-1" />
      
      <div className="px-2">
         <NotificationBell />
      </div>
    </motion.div>
  );
}
