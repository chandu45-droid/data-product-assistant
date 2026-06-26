"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import {
  Link as LinkIcon,
  RefreshCw,
  Maximize2,
  Minimize2,
  Target,
  BarChart3,
  Database,
  ListChecks,
} from "lucide-react";
import { getTraceability } from "@/lib/api";
import type { TraceabilityData, TraceNode } from "@/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// ── Column config ─────────────────────────────────────────────────

interface ColumnConfig {
  key: keyof Pick<
    TraceabilityData,
    "business_objectives" | "kpis" | "data_requirements" | "delivery_artifacts"
  >;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  activeColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: "business_objectives",
    title: "Business Objectives",
    icon: <Target className="h-4 w-4" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    activeColor: "ring-blue-400",
  },
  {
    key: "kpis",
    title: "KPIs",
    icon: <BarChart3 className="h-4 w-4" />,
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    activeColor: "ring-indigo-400",
  },
  {
    key: "data_requirements",
    title: "Data Requirements",
    icon: <Database className="h-4 w-4" />,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    activeColor: "ring-emerald-400",
  },
  {
    key: "delivery_artifacts",
    title: "Delivery Artifacts",
    icon: <ListChecks className="h-4 w-4" />,
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    activeColor: "ring-violet-400",
  },
];

// ── Helpers ───────────────────────────────────────────────────────

/** Collect all IDs in the full trace chain for a given starting node */
function collectTraceChain(
  startId: string,
  data: TraceabilityData
): Set<string> {
  const ids = new Set<string>();
  const queue = [startId];
  const allNodes: TraceNode[] = [
    ...data.business_objectives,
    ...data.kpis,
    ...data.data_requirements,
    ...data.delivery_artifacts,
  ];

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (ids.has(current)) continue;
    ids.add(current);

    // Find linked from this node
    const node = allNodes.find((n) => n.id === current);
    if (node) {
      for (const linked of node.linked_ids) {
        if (!ids.has(linked)) queue.push(linked);
      }
    }

    // Find nodes that link TO this node
    for (const n of allNodes) {
      if (n.linked_ids.includes(current) && !ids.has(n.id)) {
        queue.push(n.id);
      }
    }
  }

  return ids;
}

/** Determine completeness color for a node based on its links */
function completenessColor(
  node: TraceNode,
  colIdx: number,
  data: TraceabilityData
): "green" | "amber" | "red" {
  // First column: has downstream links?
  if (colIdx === 0) {
    return node.linked_ids.length > 0 ? "green" : "red";
  }
  // Last column: has any upstream references?
  if (colIdx === COLUMNS.length - 1) {
    const allUpstream = [
      ...data.business_objectives,
      ...data.kpis,
      ...data.data_requirements,
    ];
    const hasUpstream = allUpstream.some((n) =>
      n.linked_ids.includes(node.id)
    );
    return hasUpstream ? "green" : "red";
  }
  // Middle columns: has both up and downstream links
  const allPrev = getColumnNodes(colIdx - 1, data);
  const hasUpstream = allPrev.some((n) => n.linked_ids.includes(node.id));
  const hasDownstream = node.linked_ids.length > 0;
  if (hasUpstream && hasDownstream) return "green";
  if (hasUpstream || hasDownstream) return "amber";
  return "red";
}

function getColumnNodes(
  colIdx: number,
  data: TraceabilityData
): TraceNode[] {
  return data[COLUMNS[colIdx].key];
}

const COMPLETENESS_CLASSES = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-400",
} as const;

// ── Page Component ────────────────────────────────────────────────

export default function TraceabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { error: showError } = useToast();
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const result = await getTraceability(id);
        setData(result);
      } catch (err) {
        showError(
          "Failed to load traceability",
          err instanceof Error ? err.message : undefined
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleNodeClick = (nodeId: string) => {
    if (!data) return;
    if (selectedId === nodeId) {
      setSelectedId(null);
      setHighlightedIds(new Set());
      return;
    }
    setSelectedId(nodeId);
    const chain = collectTraceChain(nodeId, data);
    setHighlightedIds(chain);
  };

  if (loading) return <PageLoader message="Loading traceability..." />;

  const hasData =
    data &&
    (data.business_objectives.length > 0 ||
      data.kpis.length > 0 ||
      data.data_requirements.length > 0 ||
      data.delivery_artifacts.length > 0);

  return (
    <div className="animate-fade-in">
      <Header
        title="Traceability Map"
        breadcrumbs={[
          { label: "Workspaces", href: "/" },
          { label: "Traceability" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {expanded ? "Collapse" : "Expand"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              loading={refreshing}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {!hasData ? (
          <EmptyState
            icon={<LinkIcon className="h-7 w-7" />}
            title="No traceability data"
            description="Complete the discovery, requirements, and delivery workflow to see the full trace chain."
          />
        ) : (
          <>
            {/* Completeness bar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                <LinkIcon className="h-4 w-4" />
                Completeness
              </div>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data!.completeness_score}%`,
                    background:
                      data!.completeness_score >= 80
                        ? "#059669"
                        : data!.completeness_score >= 50
                          ? "#d97706"
                          : "#dc2626",
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-text-primary w-12 text-right">
                {Math.round(data!.completeness_score)}%
              </span>
            </div>

            {/* Legend */}
            <div className="mb-6 flex items-center gap-6 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Fully traced
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Partially traced
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                Missing links
              </span>
              {selectedId && (
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setHighlightedIds(new Set());
                  }}
                  className="ml-auto text-primary-accent hover:underline cursor-pointer"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* 4-column trace layout */}
            <div
              ref={containerRef}
              className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200",
                expanded ? "min-h-[80vh]" : ""
              )}
            >
              {COLUMNS.map((col, colIdx) => (
                <TraceColumn
                  key={col.key}
                  config={col}
                  nodes={data![col.key]}
                  colIdx={colIdx}
                  data={data!}
                  highlightedIds={highlightedIds}
                  selectedId={selectedId}
                  onNodeClick={handleNodeClick}
                />
              ))}
            </div>

            {/* Connection lines between columns */}
            <ConnectorOverlay
              data={data!}
              highlightedIds={highlightedIds}
              containerRef={containerRef}
              selectedId={selectedId}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Trace Column ──────────────────────────────────────────────────

function TraceColumn({
  config,
  nodes,
  colIdx,
  data,
  highlightedIds,
  selectedId,
  onNodeClick,
}: {
  config: ColumnConfig;
  nodes: TraceNode[];
  colIdx: number;
  data: TraceabilityData;
  highlightedIds: Set<string>;
  selectedId: string | null;
  onNodeClick: (id: string) => void;
}) {
  const hasHighlight = highlightedIds.size > 0;

  return (
    <div className="bg-white flex flex-col">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b",
          config.bgColor,
          config.borderColor
        )}
      >
        <span className={config.color}>{config.icon}</span>
        <h3 className={cn("text-xs font-semibold uppercase tracking-wider", config.color)}>
          {config.title}
        </h3>
        <span
          className={cn(
            "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            config.bgColor,
            config.color
          )}
        >
          {nodes.length}
        </span>
      </div>

      {/* Nodes */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="text-xs text-text-secondary italic text-center py-8">
            No items
          </p>
        ) : (
          nodes.map((node) => {
            const comp = completenessColor(node, colIdx, data);
            const isHighlighted = highlightedIds.has(node.id);
            const isSelected = selectedId === node.id;
            const isDimmed = hasHighlight && !isHighlighted;

            return (
              <button
                key={node.id}
                data-trace-id={node.id}
                onClick={() => onNodeClick(node.id)}
                className={cn(
                  "w-full text-left rounded-lg border-l-[3px] border border-border p-2.5 transition-all cursor-pointer",
                  COMPLETENESS_CLASSES[comp],
                  isSelected && `ring-2 ${config.activeColor} shadow-md`,
                  isHighlighted && !isSelected && "bg-slate-50 shadow-sm",
                  isDimmed && "opacity-30",
                  !hasHighlight && "hover:bg-slate-50 hover:shadow-sm"
                )}
              >
                <p className="text-xs font-medium text-text-primary leading-tight">
                  {node.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-text-secondary">
                    {node.type}
                  </span>
                  {node.status && (
                    <Badge
                      variant={
                        node.status === "done"
                          ? "done"
                          : node.status === "in-progress"
                            ? "in-progress"
                            : node.status === "validated"
                              ? "validated"
                              : node.status === "blocked"
                                ? "blocked"
                                : "draft"
                      }
                      className="text-[9px] py-0"
                    >
                      {node.status}
                    </Badge>
                  )}
                </div>
                {node.linked_ids.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-secondary">
                    <LinkIcon className="h-2.5 w-2.5" />
                    {node.linked_ids.length} link
                    {node.linked_ids.length !== 1 ? "s" : ""}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── CSS-based Connector Overlay ───────────────────────────────────

function ConnectorOverlay({
  data,
  highlightedIds,
  containerRef,
  selectedId,
}: {
  data: TraceabilityData;
  highlightedIds: Set<string>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  selectedId: string | null;
}) {
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; highlighted: boolean }[]
  >([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newLines: typeof lines = [];

    // For each adjacent pair of columns, draw lines between linked nodes
    for (let colIdx = 0; colIdx < COLUMNS.length - 1; colIdx++) {
      const leftNodes = data[COLUMNS[colIdx].key];
      const rightNodes = data[COLUMNS[colIdx + 1].key];

      for (const leftNode of leftNodes) {
        const leftEl = container.querySelector(
          `[data-trace-id="${leftNode.id}"]`
        );
        if (!leftEl) continue;

        for (const linkedId of leftNode.linked_ids) {
          const isRightNode = rightNodes.some((n) => n.id === linkedId);
          if (!isRightNode) continue;

          const rightEl = container.querySelector(
            `[data-trace-id="${linkedId}"]`
          );
          if (!rightEl) continue;

          const lr = leftEl.getBoundingClientRect();
          const rr = rightEl.getBoundingClientRect();

          const x1 = lr.right - rect.left;
          const y1 = lr.top + lr.height / 2 - rect.top;
          const x2 = rr.left - rect.left;
          const y2 = rr.top + rr.height / 2 - rect.top;

          const isHighlighted =
            highlightedIds.has(leftNode.id) &&
            highlightedIds.has(linkedId);

          newLines.push({ x1, y1, x2, y2, highlighted: isHighlighted });
        }
      }
    }

    setLines(newLines);
  }, [data, highlightedIds, containerRef]);

  useEffect(() => {
    // Compute after initial render
    const timer = setTimeout(computeLines, 100);

    // Recompute on resize/scroll
    const handler = () => {
      requestAnimationFrame(computeLines);
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [computeLines]);

  // Recompute when selection changes
  useEffect(() => {
    const timer = setTimeout(computeLines, 50);
    return () => clearTimeout(timer);
  }, [selectedId, computeLines]);

  if (lines.length === 0) return null;

  const container = containerRef.current;
  if (!container) return null;

  const rect = container.getBoundingClientRect();

  return (
    <svg
      ref={svgRef}
      className="absolute pointer-events-none"
      style={{
        position: "absolute",
        top: container.offsetTop,
        left: container.offsetLeft,
        width: rect.width,
        height: rect.height,
        zIndex: 10,
      }}
    >
      {lines.map((line, idx) => {
        const hasHighlight = highlightedIds.size > 0;
        const midX = (line.x1 + line.x2) / 2;

        return (
          <path
            key={idx}
            d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke={
              hasHighlight
                ? line.highlighted
                  ? "#2563eb"
                  : "#e2e8f0"
                : "#94a3b8"
            }
            strokeWidth={line.highlighted ? 2 : 1}
            strokeDasharray={line.highlighted ? undefined : "4,4"}
            opacity={hasHighlight && !line.highlighted ? 0.3 : 0.7}
            className="transition-all duration-300"
          />
        );
      })}
    </svg>
  );
}
