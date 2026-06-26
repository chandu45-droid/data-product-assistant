"use client";

import { useEffect, useState, use } from "react";
import {
  Sparkles,
  AlertTriangle,
  BarChart3,
  Database,
  ListChecks,
  Shield,
  Lightbulb,
  Clock,
  GitBranch,
} from "lucide-react";
import {
  submitImpactAnalysis,
  listImpactAnalyses,
} from "@/lib/api";
import type {
  ImpactAnalysis,
  ImpactedKPI,
  ImpactedRequirement,
  ImpactedStory,
} from "@/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner, SkeletonList } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function ImpactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { error: showError, success: showSuccess } = useToast();
  const [changeText, setChangeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<ImpactAnalysis[]>([]);
  const [selected, setSelected] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listImpactAnalyses(id)
      .then((data) => {
        setAnalyses(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch((err) => {
        showError("Failed to load analyses", err instanceof Error ? err.message : undefined);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnalyze = async () => {
    if (!changeText.trim()) return;
    try {
      setAnalyzing(true);
      const result = await submitImpactAnalysis(id, {
        change_description: changeText,
      });
      setAnalyses((prev) => [result, ...prev]);
      setSelected(result);
      setChangeText("");
      showSuccess("Impact analysis complete", "Review the results below.");
    } catch (err) {
      showError("Analysis failed", err instanceof Error ? err.message : undefined);
    } finally {
      setAnalyzing(false);
    }
  };

  const deriveRiskLevel = (assessment: string): string => {
    const lower = (assessment || "").toLowerCase();
    if (lower.includes("critical")) return "critical";
    if (lower.includes("high")) return "high";
    if (lower.includes("low") || lower.includes("minimal")) return "low";
    return "medium";
  };

  const severityVariant = (s: string) => {
    const map: Record<string, "low" | "medium" | "high" | "critical"> = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    };
    return map[s] || "medium";
  };

  const riskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: "text-emerald-700 bg-emerald-50 border-emerald-200",
      medium: "text-blue-700 bg-blue-50 border-blue-200",
      high: "text-amber-700 bg-amber-50 border-amber-200",
      critical: "text-red-700 bg-red-50 border-red-200",
    };
    return colors[level] || colors.medium;
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Impact Analysis"
        breadcrumbs={[
          { label: "Workspaces", href: "/" },
          { label: "Impact Analysis" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Describe the Change
            </CardTitle>
            <p className="text-sm text-text-secondary mt-1">
              Describe a proposed change and AI will analyze its impact across
              KPIs, data requirements, and delivery artifacts.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={changeText}
              onChange={(e) => setChangeText(e.target.value)}
              placeholder="e.g., We need to add real-time pricing data from a new vendor API, replacing the current batch ETL process..."
              className="min-h-[120px]"
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleAnalyze}
                loading={analyzing}
                disabled={!changeText.trim()}
              >
                <Sparkles className="h-4 w-4" />
                Analyze Impact
              </Button>
            </div>
          </CardContent>
        </Card>

        {analyzing && (
          <Spinner message="Analyzing impact across your data product..." />
        )}

        {/* Results + History */}
        <div className="flex flex-col-reverse lg:flex-row gap-6">
          {/* History sidebar */}
          <div className="w-full lg:w-64 lg:shrink-0 space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
              <Clock className="inline h-3.5 w-3.5 mr-1" />
              Analysis History
            </h3>
            {loading ? (
              <SkeletonList count={2} />
            ) : analyses.length === 0 ? (
              <p className="text-xs text-text-secondary italic py-4">
                No analyses yet
              </p>
            ) : (
              analyses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors cursor-pointer",
                    selected?.id === a.id
                      ? "border-primary-accent bg-primary-light/50"
                      : "border-border bg-surface hover:bg-slate-50"
                  )}
                >
                  <p className="text-xs font-medium text-text-primary line-clamp-2">
                    {a.change_description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={severityVariant(deriveRiskLevel(a.risk_assessment))}
                      className="text-[10px]"
                    >
                      {deriveRiskLevel(a.risk_assessment)} risk
                    </Badge>
                    <span className="text-[10px] text-text-secondary">
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected analysis */}
          {selected && (
            <div className="flex-1 space-y-4">
              {/* Risk Assessment */}
              <div
                className={cn(
                  "rounded-lg border p-4",
                  riskLevelColor(deriveRiskLevel(selected.risk_assessment))
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Risk Level: {deriveRiskLevel(selected.risk_assessment).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm">{selected.risk_assessment}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Impacted KPIs */}
                <ImpactList
                  title="Impacted KPIs"
                  icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
                  items={selected.impacted_kpis.map((k) => ({
                    name: k.kpi_name,
                    impact: k.impact,
                    explanation: k.explanation,
                  }))}
                />

                {/* Impacted Requirements */}
                <ImpactList
                  title="Impacted Requirements"
                  icon={<Database className="h-4 w-4 text-emerald-600" />}
                  items={selected.impacted_requirements.map((r) => ({
                    name: r.requirement,
                    impact: r.impact,
                    explanation: r.explanation,
                  }))}
                />

                {/* Impacted Stories */}
                <ImpactList
                  title="Impacted Stories"
                  icon={<ListChecks className="h-4 w-4 text-violet-600" />}
                  items={selected.impacted_stories.map((s) => ({
                    name: s.story,
                    impact: s.impact,
                    explanation: s.explanation,
                  }))}
                />
              </div>

              {/* Recommendations */}
              {selected.recommendations?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {selected.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex gap-3 text-sm text-text-primary"
                        >
                          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                            {idx + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!selected && !loading && analyses.length === 0 && (
            <div className="flex-1">
              <EmptyState
                icon={<GitBranch className="h-7 w-7" />}
                title="No impact analyses"
                description="Describe a change above to see its impact across your data product."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Impact List ────────────────────────────────────────────────────

interface ImpactListItem {
  name: string;
  impact: string;
  explanation: string;
}

function ImpactList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: ImpactListItem[];
}) {
  const impactVariant = (s: string) => {
    const map: Record<string, "low" | "medium" | "high" | "critical"> = {
      low: "low",
      minor: "low",
      moderate: "medium",
      medium: "medium",
      significant: "high",
      high: "high",
      major: "critical",
      critical: "critical",
    };
    return map[s.toLowerCase()] || "medium";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon} {title}
          <span className="ml-auto text-xs font-normal text-text-secondary">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text-primary">
                    {item.name}
                  </span>
                  <Badge
                    variant={impactVariant(item.impact)}
                    className="text-[10px]"
                  >
                    {item.impact}
                  </Badge>
                </div>
                {item.explanation && (
                  <p className="text-[11px] text-text-secondary mt-1">
                    {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary italic">No items</p>
        )}
      </CardContent>
    </Card>
  );
}
