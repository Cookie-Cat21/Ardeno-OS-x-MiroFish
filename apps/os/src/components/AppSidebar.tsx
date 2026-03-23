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
    label: "AI CORE",
    items: [
      { title: "Agents", url: "/chat", icon: Bot },
      { title: "Agent Manager", url: "/agents", icon: Users },
      { title: "Orchestrator", url: "/orchestrate", icon: Zap },
      { title: "Skills", url: "/skills", icon: Wrench },
      { title: "Parallel Society", url: "/mirofish", icon: Globe },
      { title: "Analyzer", url: "/analyzer", icon: Globe },
      { title: "Site Builder", url: "/website-builder", icon: PanelsTopLeft },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { title: "Leads", url: "/leads", icon: Users },
      { title: "Pipeline", url: "/pipeline", icon: Briefcase },
      { title: "Nurturing", url: "/nurturing", icon: GitBranch },
      { title: "Outreach", url: "/outreach", icon: Send },
      { title: "Proposals", url: "/proposals", icon: FileText },
      { title: "Invoices", url: "/invoices", icon: DollarSign },
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Tasks", url: "/tasks", icon: ListTodo },
      { title: "Gmail", url: "/gmail", icon: Mail },
      { title: "Assets", url: "/assets", icon: FolderOpen },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
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
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className={collapsed ? "px-2 py-3" : "px-4 py-4"}>
        {collapsed ? (
          <div className="flex justify-center">
            <ArdenoMark className="h-11 w-11 p-2.5" glow />
          </div>
        ) : (
          <div className="ardeno-panel cinematic-surface rounded-[24px] px-4 py-4">
            <ArdenoStudioLockup className="w-full max-w-[172px]" />
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/90">Internal Agency OS</p>
                <p className="mt-2 max-w-[11.5rem] text-[13px] leading-5 text-foreground/92">
                  Premium operating layer for Ardeno Studio.
                </p>
              </div>
              <ArdenoMark className="h-10 w-10 shrink-0 p-2.5" glow />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={collapsed ? "px-1 pb-2" : "px-3 pb-3"}>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className={collapsed ? "px-0 py-1" : "px-0 py-1"}>
            {collapsed ? (
              <div className="mx-auto my-2 h-px w-6 bg-white/10" />
            ) : (
              <p className="px-3 pb-2 pt-4 font-data text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/58">
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

      <SidebarFooter className={collapsed ? "px-2 pb-3 pt-2" : "px-4 pb-4 pt-2"}>
        {collapsed ? (
          <motion.button
            onClick={signOut}
            className="shell-icon-button mx-auto flex h-11 w-11 items-center justify-center hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
            title="Sign Out"
            {...buttonMotion}
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        ) : (
          <div className="ardeno-panel cinematic-surface rounded-[22px] px-3.5 py-3.5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-white/10 bg-black/25 text-sm font-semibold text-foreground">
                {firstName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-none text-foreground">{firstName}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Founder Access</p>
              </div>
            </div>
            <motion.button
              onClick={signOut}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 w-full justify-start rounded-[14px] px-3.5 text-[13px] text-muted-foreground hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive",
              )}
              {...buttonMotion}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        )}
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
          className={`group relative isolate flex items-center overflow-hidden rounded-[18px] border border-transparent bg-transparent text-sidebar-foreground transition-all duration-200 ${
            collapsed ? "mx-auto h-12 w-12 justify-center" : "h-[50px] gap-3 px-3.5"
          }`}
        >
          {isActive ? (
            <motion.div
              layoutId={collapsed ? "sidebar-active-pill-collapsed" : "sidebar-active-pill"}
              transition={ardenoTransitions.base}
              className="absolute inset-0 rounded-[18px] border border-primary/18 bg-[linear-gradient(180deg,rgba(255,79,0,0.16),rgba(255,79,0,0.08))] shadow-[0_16px_42px_-28px_rgba(255,79,0,0.78)]"
            />
          ) : null}
          {isActive && !collapsed ? (
            <motion.span
              layoutId="sidebar-active-bar"
              className="absolute left-[7px] top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-primary"
              transition={ardenoTransitions.base}
            />
          ) : null}
          <motion.div
            {...navItemMotion}
            className={`relative z-[1] flex items-center justify-center rounded-[12px] transition-all duration-200 ${
              collapsed ? "h-9 w-9" : "h-9 w-9"
            } ${isActive ? "bg-primary/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" : "bg-white/[0.03] group-hover:bg-white/[0.05]"}`}
          >
            <NavIcon icon={item.icon} isActive={isActive} isHovered={hovered} />
          </motion.div>
          {!collapsed ? (
            <div className="relative z-[1] flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className={`truncate text-[13px] font-medium leading-none text-inherit transition-transform duration-200 ${hovered && !isActive ? "translate-x-0.5" : ""}`}>
                {item.title}
              </span>
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active-dot"
                  transition={ardenoTransitions.base}
                  className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(255,79,0,0.08)]"
                />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-transparent transition-colors duration-200 group-hover:bg-white/15" />
              )}
            </div>
          ) : null}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
