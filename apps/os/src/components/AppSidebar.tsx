import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  FolderKanban,
  Mail,
  ListTodo,
  Settings,
  LogOut,
  Globe,
  PanelsTopLeft,
  BarChart3,
  Briefcase,
  FolderOpen,
  Brain,
  FileText,
  Send,
  DollarSign,
  Zap,
  Users,
  GitBranch,
  Wrench,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { ArdenoMark, ArdenoStudioLockup } from "@/components/brand/ArdenoBrand";
import { NavIcon } from "@/components/NavIcon";
import { ardenoTransitions, buttonMotion, navItemMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Intelligence", url: "/intelligence", icon: Brain },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "PARALLEL SOCIETY", // RENAMED FROM AI CORE
    items: [
      { title: "The Society", url: "/mirofish", icon: Globe },
      { title: "Orchestrator", url: "/orchestrate", icon: Zap },
      { title: "Agent Chat", url: "/chat", icon: Bot },
      { title: "Agent Roster", url: "/agents", icon: Users },
      { title: "Worker Skills", url: "/skills", icon: Wrench },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Task Pipeline", url: "/tasks", icon: ListTodo },
      { title: "Lead Engine", url: "/leads", icon: Users },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const location = useLocation();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator";

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/40 bg-white/40 backdrop-blur-xl">
      <SidebarHeader className={collapsed ? "px-2 py-4" : "px-5 py-6"}>
        {collapsed ? (
          <div className="flex justify-center">
            <ArdenoMark className="h-10 w-10 text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1">
            <ArdenoMark className="h-9 w-9 text-primary" />
            <div className="min-w-0">
              <ArdenoStudioLockup className="w-32" />
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Sentient OS v4.0</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={collapsed ? "px-1 pb-4" : "px-4 pb-4"}>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-0 py-2">
            {!collapsed && (
              <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400/70">
                {group.label}
              </p>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarNavItem key={item.title} item={item} collapsed={collapsed} pathname={location.pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className={collapsed ? "px-2 pb-6" : "px-4 pb-6"}>
        <div className={cn(
          "rounded-2xl border border-slate-200/50 bg-white/40 p-3 shadow-sm transition-all",
          collapsed ? "px-1.5" : "px-3"
        )}>
          {!collapsed && (
            <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                {firstName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">{firstName}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Founder</p>
              </div>
            </div>
          )}
          <motion.button
            onClick={signOut}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-xl text-[12px] font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-500",
              collapsed ? "justify-center" : "px-2.5"
            )}
            {...buttonMotion}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </motion.button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  pathname,
}: {
  item: { title: string; url: string; icon: any };
  collapsed: boolean;
  pathname: string;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} className="h-auto !p-0 hover:bg-transparent">
        <NavLink
          to={item.url}
          end={item.url === "/"}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            "group relative flex items-center rounded-xl transition-all duration-300",
            collapsed ? "mx-auto h-11 w-11 justify-center" : "h-11 gap-3 px-3",
            isActive 
              ? "bg-primary/10 text-primary shadow-[0_4px_12px_-4px_rgba(0,122,255,0.2)]" 
              : "text-slate-500 hover:bg-slate-100/60 hover:text-slate-900"
          )}
        >
          <item.icon className={cn(
            "h-4.5 w-4.5 shrink-0 transition-transform duration-300",
            isActive ? "" : "group-hover:scale-110"
          )} />
          {!collapsed && (
            <span className="text-[13px] font-semibold leading-none">{item.title}</span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
