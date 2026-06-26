"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Database,
  ListChecks,
  Trash2,
  ArrowRight,
  Boxes,
} from "lucide-react";
import { listWorkspaces, createWorkspace, deleteWorkspace } from "@/lib/api";
import type { Workspace, CreateWorkspacePayload } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<CreateWorkspacePayload>({
    name: "",
    description: "",
  });

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load workspaces. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      setCreating(true);
      const ws = await createWorkspace(form);
      setShowCreate(false);
      setForm({ name: "", description: "" });
      router.push(`/workspace/${ws.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workspace"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await deleteWorkspace(id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete workspace"
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white text-base font-bold">
              DP
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
                Data Product Discovery & Delivery Assistant
              </h1>
            </div>
          </div>
          <p className="text-text-secondary text-base max-w-xl mt-2">
            Transform business problems into structured, traceable data
            products. From discovery to delivery, powered by AI.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Workspaces
          </h2>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4" />
            New Workspace
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && workspaces.length === 0 && !error && (
          <EmptyState
            icon={<Boxes className="h-7 w-7" />}
            title="No workspaces yet"
            description="Create your first workspace to start discovering data products from business discussions."
            actionLabel="Create Workspace"
            onAction={() => setShowCreate(true)}
          />
        )}

        {/* Workspace grid */}
        {!loading && workspaces.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                className="group hover:shadow-md hover:border-primary-accent/30 transition-all duration-200 cursor-pointer animate-fade-in"
                onClick={() => router.push(`/workspace/${ws.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary truncate group-hover:text-primary-accent transition-colors">
                        {ws.name}
                      </h3>
                      {ws.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {ws.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ws.id);
                      }}
                      disabled={deleting === ws.id}
                      className="shrink-0 ml-2 p-1.5 rounded-lg text-slate-300 hover:text-danger hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete workspace"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-text-secondary mt-4">
                    <span className="flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      {ws.discovery_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {ws.requirement_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      {ws.artifact_count ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-[11px] text-text-secondary">
                      {formatDate(ws.created_at)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary-accent transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* New workspace card */}
            <div
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 cursor-pointer hover:border-primary-accent/40 hover:bg-primary-light/30 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-primary-light transition-colors">
                <Plus className="h-5 w-5 text-text-secondary group-hover:text-primary-accent" />
              </div>
              <span className="mt-2 text-sm font-medium text-text-secondary group-hover:text-primary-accent">
                New Workspace
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Workspace"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              loading={creating}
              disabled={!form.name.trim()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            placeholder="e.g., Customer Analytics Platform"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the data product or business problem..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="min-h-[80px]"
          />
        </div>
      </Modal>
    </div>
  );
}
