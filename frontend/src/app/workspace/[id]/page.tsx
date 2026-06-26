"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Database,
  ListChecks,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Circle,
  Link as LinkIcon,
} from "lucide-react";
import {
  getWorkspace,
  listDiscoveries,
  listDataRequirements,
  listDeliveryArtifacts,
  listImpactAnalyses,
  getTraceability,
} from "@/lib/api";
import type { Workspace, TraceabilityData } from "@/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading";

interface SummaryCard {
  label: string;
  value: number;
  icon: React.ElementType;
  href: string;
  color: string;
}

export default function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [counts, setCounts] = useState({
    discoveries: 0,
    requirements: 0,
    artifacts: 0,
    impacts: 0,
  });
  const [traceability, setTraceability] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ws, disc, req, art, imp] = await Promise.allSettled([
          getWorkspace(id),
          listDiscoveries(id),
          listDataRequirements(id),
          listDeliveryArtifacts(id),
          listImpactAnalyses(id),
        ]);

        if (ws.status === "fulfilled") setWorkspace(ws.value);
        setCounts({
          discoveries:
            disc.status === "fulfilled" ? disc.value.length : 0,
          requirements:
            req.status === "fulfilled" ? req.value.length : 0,
          artifacts:
            art.status === "fulfilled" ? art.value.length : 0,
          impacts:
            imp.status === "fulfilled" ? imp.value.length : 0,
        });

        // Traceability can fail independently
        try {
          const trace = await getTraceability(id);
          setTraceability(trace);
        } catch {
          // ok
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const summaryCards: SummaryCard[] = [
    {
      label: "Discoveries",
      value: counts.discoveries,
      icon: Search,
      href: `/workspace/${id}/discover`,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Data Requirements",
      value: counts.requirements,
      icon: Database,
      href: `/workspace/${id}/requirements`,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Delivery Artifacts",
      value: counts.artifacts,
      icon: ListChecks,
      href: `/workspace/${id}/delivery`,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Impact Analyses",
      value: counts.impacts,
      icon: GitBranch,
      href: `/workspace/${id}/impact`,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const workflowSteps = [
    {
      label: "Discover business context",
      done: counts.discoveries > 0,
      href: `/workspace/${id}/discover`,
    },
    {
      label: "Generate data requirements",
      done: counts.requirements > 0,
      href: `/workspace/${id}/requirements`,
    },
    {
      label: "Create delivery plan",
      done: counts.artifacts > 0,
      href: `/workspace/${id}/delivery`,
    },
    {
      label: "Assess impact",
      done: counts.impacts > 0,
      href: `/workspace/${id}/impact`,
    },
  ];

  const completenessScore = traceability?.completeness_score ?? 0;

  return (
    <div className="animate-fade-in">
      <Header
        title={workspace?.name || "Dashboard"}
        breadcrumbs={[
          { label: "Workspaces", href: "/" },
          { label: workspace?.name || "..." },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => router.push(card.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-accent transition-colors" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-text-primary">
                    {card.value}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {card.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workflow progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflowSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(step.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 text-left cursor-pointer"
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        step.done
                          ? "text-text-secondary line-through"
                          : "text-text-primary font-medium"
                      }
                    >
                      {step.label}
                    </span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traceability health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Traceability Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                {/* Circular progress */}
                <div className="relative h-28 w-28">
                  <svg
                    className="h-28 w-28 -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={
                        completenessScore >= 80
                          ? "#059669"
                          : completenessScore >= 50
                            ? "#d97706"
                            : "#dc2626"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${completenessScore * 2.64} 264`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-text-primary">
                      {Math.round(completenessScore)}%
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-text-secondary text-center">
                  Artifacts with complete trace chain
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push(`/workspace/${id}/traceability`)}
                >
                  View Traceability
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={() => router.push(`/workspace/${id}/discover`)}
              >
                <Search className="h-4 w-4" />
                Start Discovery
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/workspace/${id}/requirements`)
                }
              >
                <Database className="h-4 w-4" />
                Generate Requirements
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/workspace/${id}/delivery`)}
              >
                <ListChecks className="h-4 w-4" />
                Create Delivery Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
