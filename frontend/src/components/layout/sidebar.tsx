"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Database,
  ListChecks,
  GitBranch,
  Link as LinkIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  workspaceId: string;
  workspaceName: string;
}

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Discovery", href: "/discover", icon: Search },
  { label: "Data Requirements", href: "/requirements", icon: Database },
  { label: "Delivery Plan", href: "/delivery", icon: ListChecks },
  { label: "Impact Analysis", href: "/impact", icon: GitBranch },
  { label: "Traceability", href: "/traceability", icon: LinkIcon },
];

export function Sidebar({ workspaceId, workspaceName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceId}`;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">
          DP
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">
              DPDA
            </p>
            <p className="text-[10px] text-text-secondary truncate leading-tight">
              Data Product Discovery
            </p>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto p-1 rounded-lg text-text-secondary hover:bg-slate-100 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace indicator */}
      {!collapsed && (
        <div className="border-b border-border px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">
            Workspace
          </p>
          <Link
            href="/"
            className="mt-1 block text-sm font-medium text-primary-accent hover:underline truncate"
          >
            {workspaceName}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const fullHref = `${basePath}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === basePath
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={item.label}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary-accent"
                  : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>All Workspaces</span>}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-surface border-r border-border transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col border-r border-border bg-surface transition-all duration-200",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
