"use client";

import { useEffect, useState, use } from "react";
import { getWorkspace } from "@/lib/api";
import type { Workspace } from "@/types";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { PageLoader } from "@/components/ui/loading";

export default function WorkspaceRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorkspace(id)
      .then(setWorkspace)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load workspace")
      );
  }, [id]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-danger mb-2">Error loading workspace</p>
          <p className="text-xs text-text-secondary">{error}</p>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-primary-accent hover:underline"
          >
            Back to Workspaces
          </a>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return <PageLoader message="Loading workspace..." />;
  }

  return (
    <WorkspaceLayout workspaceId={id} workspaceName={workspace.name}>
      {children}
    </WorkspaceLayout>
  );
}
