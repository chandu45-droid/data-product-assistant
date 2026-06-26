"use client";

import { useEffect, useState, use } from "react";
import {
  Sparkles,
  Save,
  Pencil,
  X,
  Plus,
  Trash2,
  Clock,
  Target,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";
import {
  submitDiscovery,
  listDiscoveries,
  updateDiscovery,
} from "@/lib/api";
import type { Discovery, KPI, BusinessObjective, Stakeholder } from "@/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner, SkeletonList } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn, timeAgo } from "@/lib/utils";

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { error: showError, success: showSuccess } = useToast();
  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [tab, setTab] = useState<"input" | "history">("input");

  useEffect(() => {
    listDiscoveries(id)
      .then((data) => {
        setDiscoveries(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch((err) => {
        showError("Failed to load discoveries", err instanceof Error ? err.message : undefined);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    try {
      setAnalyzing(true);
      setError(null);
      const result = await submitDiscovery(id, {
        title: inputText.split("\n")[0].slice(0, 100),
        raw_input: inputText,
      });
      setDiscoveries((prev) => [result, ...prev]);
      setSelected(result);
      setInputText("");
      setTab("history");
      showSuccess("Discovery complete", "AI extracted business objectives, stakeholders, KPIs, and risks.");
    } catch (err) {
      showError(
        "Analysis failed",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (
    field: string,
    value: string[] | KPI[] | BusinessObjective[] | Stakeholder[]
  ) => {
    if (!selected) return;
    try {
      const updated = await updateDiscovery(selected.id, {
        [field]: value,
      });
      setSelected(updated);
      setDiscoveries((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      setEditSection(null);
      showSuccess("Changes saved");
    } catch (err) {
      showError(
        "Failed to save",
        err instanceof Error ? err.message : undefined
      );
    }
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Discovery"
        breadcrumbs={[
          { label: "Workspaces", href: "/" },
          { label: "Discovery" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setTab("input")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              tab === "input"
                ? "border-primary-accent text-primary-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              New Analysis
            </span>
          </button>
          <button
            onClick={() => setTab("history")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              tab === "history"
                ? "border-primary-accent text-primary-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History ({discoveries.length})
            </span>
          </button>
        </div>

        {tab === "input" && (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Analyze Business Context</CardTitle>
                <p className="text-sm text-text-secondary mt-1">
                  Paste meeting notes, transcripts, or any business discussion
                  text. AI will extract structured insights.
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your meeting notes, business requirements discussion, or stakeholder interview transcript here..."
                  className="min-h-[240px] text-sm"
                  showCount
                  maxLength={10000}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    loading={analyzing}
                    disabled={!inputText.trim()}
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analyze with AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {analyzing && (
              <div className="mt-8">
                <Spinner message="Analyzing business context... This may take a moment." />
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* History list */}
            <div className="w-full lg:w-72 lg:shrink-0 space-y-2">
              {loading ? (
                <SkeletonList count={3} />
              ) : discoveries.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title="No discoveries yet"
                  description="Submit text for AI analysis to get started."
                  actionLabel="New Analysis"
                  onAction={() => setTab("input")}
                />
              ) : (
                discoveries.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors cursor-pointer",
                      selected?.id === d.id
                        ? "border-primary-accent bg-primary-light/50"
                        : "border-border bg-surface hover:bg-slate-50"
                    )}
                  >
                    <p className="text-sm font-medium text-text-primary truncate">
                      {d.title || d.raw_input.slice(0, 50) + "..."}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {timeAgo(d.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Selected discovery detail */}
            {selected && (
              <div className="flex-1 space-y-4">
                {/* Business Objectives */}
                <EditableObjectivesSection
                  objectives={selected.business_objectives}
                  editing={editSection === "business_objectives"}
                  onEdit={() => setEditSection("business_objectives")}
                  onCancel={() => setEditSection(null)}
                  onSave={(val) => handleSave("business_objectives", val)}
                />

                {/* Stakeholders */}
                <EditableStakeholdersSection
                  stakeholders={selected.stakeholders}
                  editing={editSection === "stakeholders"}
                  onEdit={() => setEditSection("stakeholders")}
                  onCancel={() => setEditSection(null)}
                  onSave={(val) => handleSave("stakeholders", val)}
                />

                {/* KPIs */}
                <EditableKPISection
                  kpis={selected.kpis}
                  editing={editSection === "kpis"}
                  onEdit={() => setEditSection("kpis")}
                  onCancel={() => setEditSection(null)}
                  onSave={(val) => handleSave("kpis", val)}
                />

                {/* Assumptions */}
                <EditableListSection
                  title="Assumptions"
                  icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
                  items={selected.assumptions}
                  field="assumptions"
                  editing={editSection === "assumptions"}
                  onEdit={() => setEditSection("assumptions")}
                  onCancel={() => setEditSection(null)}
                  onSave={(val) => handleSave("assumptions", val)}
                />

                {/* Risks */}
                <EditableListSection
                  title="Risks"
                  icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                  items={selected.risks}
                  field="risks"
                  editing={editSection === "risks"}
                  onEdit={() => setEditSection("risks")}
                  onCancel={() => setEditSection(null)}
                  onSave={(val) => handleSave("risks", val)}
                />

                {/* Success Metrics */}
                <EditableListSection
                  title="Success Metrics"
                  icon={<BarChart3 className="h-4 w-4 text-amber-600" />}
                  items={selected.success_metrics}
                  field="success_metrics"
                  editing={editSection === "success_metrics"}
                  onEdit={() => setEditSection("success_metrics")}
                  onCancel={() => setEditSection(null)}
                  onSave={(val) => handleSave("success_metrics", val)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Editable List Section ──────────────────────────────────────────

function EditableListSection({
  title,
  icon,
  items,
  field,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  field: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (val: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(items);

  const startEdit = () => {
    setDraft([...items]);
    onEdit();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon} {title}
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            {draft.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = e.target.value;
                    setDraft(next);
                  }}
                  className="text-sm"
                />
                <button
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-danger cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraft([...draft, ""])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>
        ) : items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-text-primary"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary italic">No items</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Editable Business Objectives Section ──────────────────────────

function EditableObjectivesSection({
  objectives,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  objectives: BusinessObjective[];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (val: BusinessObjective[]) => void;
}) {
  const [draft, setDraft] = useState<BusinessObjective[]>(objectives);

  const startEdit = () => {
    setDraft(objectives.map((o) => ({ ...o })));
    onEdit();
  };

  const updateDraft = (idx: number, field: keyof BusinessObjective, val: string) => {
    const next = draft.map((o, i) =>
      i === idx ? { ...o, [field]: val } : o
    );
    setDraft(next);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-blue-600" /> Business Objectives
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {(editing ? draft : objectives).length > 0 ? (
          <div className="space-y-3">
            {(editing ? draft : objectives).map((obj, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3">
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={obj.name}
                        onChange={(e) => updateDraft(idx, "name", e.target.value)}
                        placeholder="Objective name"
                        className="text-sm font-medium"
                      />
                      <button
                        onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      value={obj.description}
                      onChange={(e) => updateDraft(idx, "description", e.target.value)}
                      placeholder="Description"
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">{obj.name}</p>
                    <p className="text-xs text-text-secondary mt-1">{obj.description}</p>
                  </>
                )}
              </div>
            ))}
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft([...draft, { name: "", description: "" }])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Objective
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary italic">No objectives</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Editable Stakeholders Section ─────────────────────────────────

function EditableStakeholdersSection({
  stakeholders,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  stakeholders: Stakeholder[];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (val: Stakeholder[]) => void;
}) {
  const [draft, setDraft] = useState<Stakeholder[]>(stakeholders);

  const startEdit = () => {
    setDraft(stakeholders.map((s) => ({ ...s })));
    onEdit();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-violet-600" /> Stakeholders
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            {draft.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-lg border border-border p-3">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    value={s.name}
                    onChange={(e) => {
                      const next = [...draft];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setDraft(next);
                    }}
                    placeholder="Name"
                    className="text-xs"
                  />
                  <Input
                    value={s.role}
                    onChange={(e) => {
                      const next = [...draft];
                      next[idx] = { ...next[idx], role: e.target.value };
                      setDraft(next);
                    }}
                    placeholder="Role"
                    className="text-xs"
                  />
                  <Input
                    value={s.interest}
                    onChange={(e) => {
                      const next = [...draft];
                      next[idx] = { ...next[idx], interest: e.target.value };
                      setDraft(next);
                    }}
                    placeholder="Interest"
                    className="text-xs"
                  />
                </div>
                <button
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-danger cursor-pointer mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraft([...draft, { name: "", role: "", interest: "" }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Stakeholder
            </Button>
          </div>
        ) : stakeholders.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stakeholders.map((s, idx) => (
              <div
                key={idx}
                className="inline-flex flex-col rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5"
              >
                <span className="text-xs font-medium text-text-primary">{s.name}</span>
                <span className="text-[10px] text-text-secondary">{s.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary italic">No stakeholders</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Editable KPI Table ─────────────────────────────────────────────

function EditableKPISection({
  kpis,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  kpis: KPI[];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (val: KPI[]) => void;
}) {
  const [draft, setDraft] = useState<KPI[]>(kpis);

  const startEdit = () => {
    setDraft(kpis.map((k) => ({ ...k })));
    onEdit();
  };

  const updateDraft = (idx: number, field: keyof KPI, val: string) => {
    const next = draft.map((k, i) =>
      i === idx ? { ...k, [field]: val } : k
    );
    setDraft(next);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          KPIs
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {(editing ? draft : kpis).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-text-secondary">
                    Name
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium text-text-secondary">
                    Description
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium text-text-secondary">
                    Target
                  </th>
                  <th className="pb-2 text-xs font-medium text-text-secondary">
                    Measurement
                  </th>
                  {editing && <th className="pb-2 w-8" />}
                </tr>
              </thead>
              <tbody>
                {(editing ? draft : kpis).map((kpi, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    {editing ? (
                      <>
                        <td className="py-2 pr-2">
                          <input
                            value={kpi.name}
                            onChange={(e) =>
                              updateDraft(idx, "name", e.target.value)
                            }
                            className="w-full rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            value={kpi.description}
                            onChange={(e) =>
                              updateDraft(idx, "description", e.target.value)
                            }
                            className="w-full rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            value={kpi.target}
                            onChange={(e) =>
                              updateDraft(idx, "target", e.target.value)
                            }
                            className="w-full rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            value={kpi.measurement}
                            onChange={(e) =>
                              updateDraft(idx, "measurement", e.target.value)
                            }
                            className="w-full rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-accent"
                          />
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() =>
                              setDraft(draft.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-danger cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 pr-4 font-medium text-text-primary">
                          {kpi.name}
                        </td>
                        <td className="py-2.5 pr-4 text-text-secondary">
                          {kpi.description}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-text-primary">
                          {kpi.target}
                        </td>
                        <td className="py-2.5 text-text-secondary">
                          {kpi.measurement}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                  setDraft([
                    ...draft,
                    { name: "", description: "", target: "", measurement: "" },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add KPI
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary italic">No KPIs</p>
        )}
      </CardContent>
    </Card>
  );
}

