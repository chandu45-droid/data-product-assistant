"use client";

import { useEffect, useState, use } from "react";
import {
  Sparkles,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Database,
  AlertTriangle,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import {
  listDataRequirements,
  generateDataRequirements,
  updateDataRequirement,
} from "@/lib/api";
import type {
  DataRequirement,
  RequirementPriority,
  RequirementStatus,
} from "@/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner, SkeletonList } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

export default function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { error: showError, success: showSuccess } = useToast();
  const [requirements, setRequirements] = useState<DataRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<"priority" | "status">("priority");

  useEffect(() => {
    listDataRequirements(id)
      .then(setRequirements)
      .catch((err) => {
        showError("Failed to load requirements", err instanceof Error ? err.message : undefined);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const result = await generateDataRequirements(id);
      setRequirements(result);
      showSuccess("Requirements generated", `${result.length} data requirements identified.`);
    } catch (err) {
      showError(
        "Generation failed",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async (
    reqId: string,
    updates: Partial<DataRequirement>
  ) => {
    try {
      const updated = await updateDataRequirement(reqId, updates);
      setRequirements((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setEditingId(null);
      showSuccess("Requirement updated");
    } catch (err) {
      showError("Update failed", err instanceof Error ? err.message : undefined);
    }
  };

  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const filtered = requirements
    .filter(
      (r) =>
        (filterPriority === "all" || r.priority === filterPriority) &&
        (filterStatus === "all" || r.status === filterStatus)
    )
    .sort((a, b) => {
      if (sortField === "priority") {
        return (
          (priorityOrder[a.priority] ?? 99) -
          (priorityOrder[b.priority] ?? 99)
        );
      }
      return a.status.localeCompare(b.status);
    });

  return (
    <div className="animate-fade-in">
      <Header
        title="Data Requirements"
        breadcrumbs={[
          { label: "Workspaces", href: "/" },
          { label: "Data Requirements" },
        ]}
        actions={
          <Button onClick={handleGenerate} loading={generating} size="sm">
            <Sparkles className="h-4 w-4" />
            Generate from Discoveries
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {generating && (
          <Spinner message="Generating data requirements from discoveries..." />
        )}

        {!generating && (
          <>
            {/* Filters */}
            {requirements.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter:</span>
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="h-8 rounded-md border border-border bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-8 rounded-md border border-border bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                >
                  <option value="all">All Statuses</option>
                  <option value="identified">Identified</option>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="validated">Validated</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button
                  onClick={() =>
                    setSortField(
                      sortField === "priority" ? "status" : "priority"
                    )
                  }
                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort: {sortField}
                </button>
                <span className="ml-auto text-xs text-text-secondary">
                  {filtered.length} of {requirements.length} shown
                </span>
              </div>
            )}

            {loading ? (
              <SkeletonList count={3} />
            ) : requirements.length === 0 ? (
              <EmptyState
                icon={<Database className="h-7 w-7" />}
                title="No data requirements yet"
                description="Generate requirements from your discoveries or create them manually."
                actionLabel="Generate from Discoveries"
                onAction={handleGenerate}
              />
            ) : (
              <div className="space-y-4">
                {filtered.map((req) => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    editing={editingId === req.id}
                    onEdit={() => setEditingId(req.id)}
                    onCancel={() => setEditingId(null)}
                    onSave={(updates) => handleUpdate(req.id, updates)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Requirement Card ───────────────────────────────────────────────

function RequirementCard({
  requirement: req,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  requirement: DataRequirement;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<DataRequirement>) => void;
}) {
  const [draft, setDraft] = useState(req);

  const startEdit = () => {
    setDraft({ ...req });
    onEdit();
  };

  const priorityVariant = (p: string) =>
    (p as RequirementPriority) || "default";

  const statusVariant = (s: string) => {
    const map: Record<string, "draft" | "in-progress" | "validated" | "blocked"> = {
      identified: "draft",
      draft: "draft",
      "in-progress": "in-progress",
      validated: "validated",
      blocked: "blocked",
    };
    return map[s] || "draft";
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={draft.business_entity}
              onChange={(e) =>
                setDraft({ ...draft, business_entity: e.target.value })
              }
              className="text-base font-semibold"
            />
          ) : (
            <CardTitle className="text-base">{req.business_entity}</CardTitle>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={priorityVariant(req.priority)}>
              {req.priority}
            </Badge>
            <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
          </div>
        </div>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Data Points */}
          <TagGroup
            label="Data Points"
            items={editing ? draft.data_points : req.data_points}
            editing={editing}
            onChange={(val) => setDraft({ ...draft, data_points: val })}
          />
          {/* Source Systems */}
          <TagGroup
            label="Source Systems"
            items={editing ? draft.source_systems : req.source_systems}
            editing={editing}
            onChange={(val) => setDraft({ ...draft, source_systems: val })}
          />
          {/* Dependencies */}
          <TagGroup
            label="Dependencies"
            items={editing ? draft.dependencies : req.dependencies}
            editing={editing}
            onChange={(val) => setDraft({ ...draft, dependencies: val })}
          />
        </div>

        {/* Gaps */}
        {(req.gaps?.length > 0 || editing) && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 mb-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Data Gaps
            </div>
            <TagGroup
              label=""
              items={editing ? draft.gaps : req.gaps}
              editing={editing}
              onChange={(val) => setDraft({ ...draft, gaps: val })}
              variant="warning"
            />
          </div>
        )}

        {/* Status/Priority controls when editing */}
        {editing && (
          <div className="mt-4 flex gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Priority
              </label>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    priority: e.target.value as RequirementPriority,
                  })
                }
                className="mt-1 block h-8 rounded-md border border-border bg-white px-2 text-xs"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Status
              </label>
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as RequirementStatus,
                  })
                }
                className="mt-1 block h-8 rounded-md border border-border bg-white px-2 text-xs"
              >
                <option value="identified">Identified</option>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="validated">Validated</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Tag Group ──────────────────────────────────────────────────────

function TagGroup({
  label,
  items,
  editing,
  onChange,
  variant = "default",
}: {
  label: string;
  items: string[];
  editing: boolean;
  onChange: (val: string[]) => void;
  variant?: "default" | "warning";
}) {
  const [newVal, setNewVal] = useState("");

  const add = () => {
    if (newVal.trim()) {
      onChange([...items, newVal.trim()]);
      setNewVal("");
    }
  };

  const tagClass =
    variant === "warning"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-slate-50 text-text-primary border-slate-200";

  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-text-secondary mb-1.5">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${tagClass}`}
          >
            {item}
            {editing && (
              <button
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-danger cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
        {editing && (
          <span className="inline-flex items-center gap-1">
            <input
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Add..."
              className="h-6 w-24 rounded border border-border bg-white px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
            />
            <button
              onClick={add}
              className="text-primary-accent cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
        {!editing && items.length === 0 && (
          <span className="text-xs text-text-secondary italic">None</span>
        )}
      </div>
    </div>
  );
}
