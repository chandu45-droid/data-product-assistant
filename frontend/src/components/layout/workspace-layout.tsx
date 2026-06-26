"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface WorkspaceLayoutProps {
  workspaceId: string;
  workspaceName: string;
  children: ReactNode;
}

export function WorkspaceLayout({
  workspaceId,
  workspaceName,
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceId={workspaceId} workspaceName={workspaceName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
