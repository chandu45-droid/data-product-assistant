"use client";

import { useEffect, useState, use } from "react";
import {
  Sparkles,
  Pencil,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ListChecks,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  listDeliveryArtifacts,
  generateDeliveryPlan,
  updateDeliveryArtifact,
} from "@/lib/api";
import type {
  DeliveryArtifact,
  RequirementPriority,
  ArtifactStatus,
} from "@/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner, SkeletonList } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export default function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [artifacts, setArtifacts] = useState<DeliveryArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set()
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    listDeliveryArtifacts(id)
      .then((data) => {
        setArtifacts(data);
        // Auto-expand all epics
        const epicIds = new Set(
          data.filter((a) => a.type === "epic").map((a) => a.id)
        );
        setExpandedEpics(epicIds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const result = await generateDeliveryPlan(id);
      setArtifacts(result);
      const epicIds = new Set(
        result.filter((a) => a.type === "epic").map((a) => a.id)
      );
      setExpandedEpics(epicIds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Generation failed"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async (
    artifactId: string,
    updates: Partial<DeliveryArtifact>
  ) => {
    try {
      const updated = await updateDeliveryArtifact(artifactId, updates);
      setArtifacts((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      next.has(epicId) ? next.delete(epicId) : next.add(epicId);
      return next;
    });
  };

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      next.has(featureId) ? next.delete(featureId) : next.add(featureId);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedEpics.size > 0) {
      setExpandedEpics(new Set());
      setExpandedFeatures(new Set());
    } else {
      setExpandedEpics(
        new Set(artifacts.filter((a) => a.type === "epic").map((a) => a.id))
      );
      setExpandedFeatures(
        new Set(
          artifacts.filter((a) => a.type === "feature").map((a) => a.id)
        )
      );
    }
  };

  // Build hierarchy
  const epics = artifacts.filter((a) => a.type === "epic");
  const getChildren = (parentId: string) =>
    artifacts.filter((a) => a.parent_id === parentId);

  const statusVariant = (s: string) => {
    const map: Record<string, "draft" | "in-progress" | "done" | "blocked"> = {
      planned: "draft",
      draft: "draft",
      "in-progress": "in-progress",
      done: "done",
      blocked: "blocked",
    };
    return map[s] || "draft";
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Delivery Plan"
        breadcrumbs={[
          { label: "Workspaces", href: "/" },
          { label: "Delivery Plan" },
        ]}
        actions={
          <div className="flex gap-2">
            {artifacts.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleAll}>
                <ChevronsUpDown className="h-4 w-4" />
                {expandedEpics.size > 0 ? "Collapse All" : "Expand All"}
              </Button>
            )}
            <Button onClick={handleGenerate} loading={generating} size="sm">
              <Sparkles className="h-4 w-4" />
              Generate Delivery Plan
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
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

        {generating && (
          <Spinner message="Generating delivery plan from requirements..." />
        )}

        {!generating && loading && <SkeletonList count={3} />}

        {!generating && !loading && artifacts.length === 0 && (
          <EmptyState
            icon={<ListChecks className="h-7 w-7" />}
            title="No delivery plan yet"
            description="Generate a structured delivery plan (epics, features, stories) from your data requirements."
            actionLabel="Generate Delivery Plan"
            onAction={handleGenerate}
          />
        )}

        {!generating && !loading && epics.length > 0 && (
          <div className="space-y-4">
            {epics.map((epic) => (
              <Card key={epic.id} className="overflow-hidden">
                {/* Epic header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => toggleEpic(epic.id)}
                >
                  {expandedEpics.has(epic.id) ? (
                    <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-text-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-primary-accent">
                        EPIC
                      </span>
                      <Badge variant={statusVariant(epic.status)} className="text-[10px]">
                        {epic.status}
                      </Badge>
                      <Badge variant={epic.priority as RequirementPriority} className="text-[10px]">
                        {epic.priority}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mt-1">
                      {epic.title}
                    </h3>
                    {epic.description && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                        {epic.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(epic.id);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>

                {/* Epic edit form */}
                {editingId === epic.id && (
                  <ArtifactEditForm
                    artifact={epic}
                    onSave={(updates) => handleUpdate(epic.id, updates)}
                    onCancel={() => setEditingId(null)}
                  />
                )}

                {/* Features */}
                {expandedEpics.has(epic.id) && (
                  <div className="border-t border-border">
                    {getChildren(epic.id).map((feature) => (
                      <div key={feature.id} className="border-b border-border last:border-0">
                        {/* Feature header */}
                        <div
                          className="flex items-center gap-3 pl-10 pr-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          onClick={() => toggleFeature(feature.id)}
                        >
                          {expandedFeatures.has(feature.id) ? (
                            <ChevronDown className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium uppercase tracking-wider text-violet-600">
                                FEATURE
                              </span>
                              <Badge
                                variant={statusVariant(feature.status)}
                                className="text-[10px]"
                              >
                                {feature.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-text-primary mt-0.5">
                              {feature.title}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(feature.id);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>

                        {editingId === feature.id && (
                          <ArtifactEditForm
                            artifact={feature}
                            onSave={(updates) =>
                              handleUpdate(feature.id, updates)
                            }
                            onCancel={() => setEditingId(null)}
                          />
                        )}

                        {/* Stories */}
                        {expandedFeatures.has(feature.id) && (
                          <div className="pl-16 pr-4 pb-3 space-y-2">
                            {getChildren(feature.id).map((story) => (
                              <StoryCard
                                key={story.id}
                                story={story}
                                editing={editingId === story.id}
                                onEdit={() => setEditingId(story.id)}
                                onCancel={() => setEditingId(null)}
                                onSave={(updates) =>
                                  handleUpdate(story.id, updates)
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {getChildren(epic.id).length === 0 && (
                      <div className="py-6 text-center text-xs text-text-secondary">
                        No features under this epic
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Story Card ─────────────────────────────────────────────────────

function StoryCard({
  story,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  story: DeliveryArtifact;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<DeliveryArtifact>) => void;
}) {
  if (editing) {
    return (
      <ArtifactEditForm
        artifact={story}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  const statusVariant = (s: string) => {
    const map: Record<string, "draft" | "in-progress" | "done" | "blocked"> = {
      planned: "draft",
      draft: "draft",
      "in-progress": "in-progress",
      done: "done",
      blocked: "blocked",
    };
    return map[s] || "draft";
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
              STORY
            </span>
            <Badge variant={statusVariant(story.status)} className="text-[10px]">
              {story.status}
            </Badge>
            <Badge variant={story.priority as RequirementPriority} className="text-[10px]">
              {story.priority}
            </Badge>
          </div>
          <p className="text-sm font-medium text-text-primary">{story.title}</p>
          {story.description && (
            <p className="text-xs text-text-secondary mt-1">
              {story.description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      {/* Acceptance Criteria */}
      {story.acceptance_criteria?.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">
            Acceptance Criteria
          </p>
          <div className="space-y-1">
            {story.acceptance_criteria.map((ac, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <Square className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                <span className="text-text-primary">{ac}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked requirements */}
      {story.linked_requirement_ids?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {story.linked_requirement_ids.map((rid) => (
            <span
              key={rid}
              className="text-[10px] text-primary-accent bg-primary-light px-1.5 py-0.5 rounded font-mono"
            >
              REQ-{rid.slice(0, 6)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Artifact Edit Form ─────────────────────────────────────────────

function ArtifactEditForm({
  artifact,
  onSave,
  onCancel,
}: {
  artifact: DeliveryArtifact;
  onSave: (updates: Partial<DeliveryArtifact>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(artifact.title);
  const [description, setDescription] = useState(artifact.description || "");
  const [status, setStatus] = useState(artifact.status);
  const [priority, setPriority] = useState(artifact.priority);
  const [criteria, setCriteria] = useState<string[]>(
    artifact.acceptance_criteria || []
  );

  return (
    <div className="border-t border-border bg-slate-50/50 p-4 space-y-3">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[80px]"
      />
      <div className="flex gap-4">
        <div>
          <label className="text-xs font-medium text-text-secondary">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArtifactStatus)}
            className="mt-1 block h-8 rounded-md border border-border bg-white px-2 text-xs"
          >
            <option value="planned">Planned</option>
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as RequirementPriority)
            }
            className="mt-1 block h-8 rounded-md border border-border bg-white px-2 text-xs"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Acceptance Criteria editing (for stories) */}
      {artifact.type === "story" && (
        <div>
          <label className="text-xs font-medium text-text-secondary">
            Acceptance Criteria
          </label>
          <div className="mt-1 space-y-1.5">
            {criteria.map((ac, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={ac}
                  onChange={(e) => {
                    const next = [...criteria];
                    next[idx] = e.target.value;
                    setCriteria(next);
                  }}
                  className="flex-1 rounded border border-border bg-white px-2 py-1 text-xs"
                />
                <button
                  onClick={() =>
                    setCriteria(criteria.filter((_, i) => i !== idx))
                  }
                  className="text-slate-400 hover:text-danger cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCriteria([...criteria, ""])}
              className="text-xs text-primary-accent hover:underline cursor-pointer"
            >
              + Add criteria
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() =>
            onSave({
              title,
              description,
              status,
              priority,
              acceptance_criteria: criteria,
            })
          }
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}
