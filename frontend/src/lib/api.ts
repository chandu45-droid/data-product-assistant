import type {
  Workspace,
  CreateWorkspacePayload,
  Discovery,
  DiscoverPayload,
  UpdateDiscoveryPayload,
  DataRequirement,
  UpdateDataRequirementPayload,
  DeliveryArtifact,
  UpdateDeliveryArtifactPayload,
  ImpactAnalysis,
  ImpactAnalysisPayload,
  TraceabilityData,
  TraceabilityResponse,
  TraceNode,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ── Fetch wrapper ──────────────────────────────────────────────────

class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(message, res.status);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Workspaces ─────────────────────────────────────────────────────

export async function createWorkspace(
  payload: CreateWorkspacePayload
): Promise<Workspace> {
  return request<Workspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>("/workspaces");
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return request<Workspace>(`/workspaces/${id}`);
}

export async function deleteWorkspace(id: string): Promise<void> {
  return request<void>(`/workspaces/${id}`, { method: "DELETE" });
}

// ── Discovery ──────────────────────────────────────────────────────

export async function submitDiscovery(
  workspaceId: string,
  payload: DiscoverPayload
): Promise<Discovery> {
  return request<Discovery>(`/workspaces/${workspaceId}/discover`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listDiscoveries(
  workspaceId: string
): Promise<Discovery[]> {
  return request<Discovery[]>(`/workspaces/${workspaceId}/discoveries`);
}

export async function getDiscovery(id: string): Promise<Discovery> {
  return request<Discovery>(`/discoveries/${id}`);
}

export async function updateDiscovery(
  id: string,
  payload: UpdateDiscoveryPayload
): Promise<Discovery> {
  return request<Discovery>(`/discoveries/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Data Requirements ──────────────────────────────────────────────

export async function generateDataRequirements(
  workspaceId: string
): Promise<DataRequirement[]> {
  return request<DataRequirement[]>(
    `/workspaces/${workspaceId}/data-requirements/generate`,
    { method: "POST" }
  );
}

export async function listDataRequirements(
  workspaceId: string
): Promise<DataRequirement[]> {
  return request<DataRequirement[]>(
    `/workspaces/${workspaceId}/data-requirements`
  );
}

export async function updateDataRequirement(
  id: string,
  payload: UpdateDataRequirementPayload
): Promise<DataRequirement> {
  return request<DataRequirement>(`/data-requirements/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Delivery Artifacts ─────────────────────────────────────────────

/** Flatten a tree-structured delivery response into a flat array.
 *  Backend returns epics with nested children; frontend needs a flat
 *  array where parent_id references link items together. */
function flattenDeliveryTree(tree: DeliveryArtifact[]): DeliveryArtifact[] {
  const flat: DeliveryArtifact[] = [];
  for (const item of tree) {
    const { children, ...rest } = item;
    flat.push(rest as DeliveryArtifact);
    if (children && children.length > 0) {
      flat.push(...flattenDeliveryTree(children));
    }
  }
  return flat;
}

export async function generateDeliveryPlan(
  workspaceId: string
): Promise<DeliveryArtifact[]> {
  const tree = await request<DeliveryArtifact[]>(
    `/workspaces/${workspaceId}/delivery-plan/generate`,
    { method: "POST" }
  );
  return flattenDeliveryTree(tree);
}

export async function listDeliveryArtifacts(
  workspaceId: string
): Promise<DeliveryArtifact[]> {
  const tree = await request<DeliveryArtifact[]>(
    `/workspaces/${workspaceId}/delivery-artifacts`
  );
  return flattenDeliveryTree(tree);
}

export async function updateDeliveryArtifact(
  id: string,
  payload: UpdateDeliveryArtifactPayload
): Promise<DeliveryArtifact> {
  return request<DeliveryArtifact>(`/delivery-artifacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Impact Analysis ────────────────────────────────────────────────

export async function submitImpactAnalysis(
  workspaceId: string,
  payload: ImpactAnalysisPayload
): Promise<ImpactAnalysis> {
  return request<ImpactAnalysis>(
    `/workspaces/${workspaceId}/impact-analysis`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function listImpactAnalyses(
  workspaceId: string
): Promise<ImpactAnalysis[]> {
  return request<ImpactAnalysis[]>(
    `/workspaces/${workspaceId}/impact-analyses`
  );
}

// ── Traceability ───────────────────────────────────────────────────

function transformTraceability(raw: TraceabilityResponse): TraceabilityData {
  const businessObjectives: TraceNode[] = [];
  const kpis: TraceNode[] = [];
  const dataRequirements: TraceNode[] = [];
  const deliveryArtifacts: TraceNode[] = [];

  // Track KPI-to-requirement links from requirements side
  const kpiLinkedReqIds = new Map<string, string[]>();

  // Process discoveries → business objectives + KPIs
  for (const disc of raw.discoveries) {
    for (const obj of disc.business_objectives) {
      // Create a stable ID for the objective
      const objId = `obj-${disc.id}-${obj.name.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}`;
      // Link objectives to KPIs in same discovery
      const kpiIds = disc.kpis.map(
        (k) => `kpi-${disc.id}-${k.name.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}`
      );
      businessObjectives.push({
        id: objId,
        name: obj.name,
        type: "objective",
        linked_ids: kpiIds,
      });
    }

    for (const k of disc.kpis) {
      const kpiId = `kpi-${disc.id}-${k.name.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}`;
      // Link KPIs to requirements they're linked to
      const reqIds = k.linked_requirement_ids || [];
      kpis.push({
        id: kpiId,
        name: k.name,
        type: "kpi",
        linked_ids: reqIds,
      });
    }
  }

  // Process data requirements
  for (const req of raw.data_requirements) {
    dataRequirements.push({
      id: req.id,
      name: req.business_entity,
      type: "requirement",
      status: req.status,
      linked_ids: req.linked_artifact_ids || [],
    });
  }

  // Process delivery artifacts (flatten hierarchy)
  const flattenArtifacts = (
    artifacts: TraceabilityResponse["delivery_artifacts"],
    linkedReqIds: string[] = []
  ) => {
    for (const art of artifacts) {
      deliveryArtifacts.push({
        id: art.id,
        name: art.title,
        type: art.type,
        status: art.status,
        linked_ids: art.linked_requirement_ids || linkedReqIds,
      });
      if (art.children?.length > 0) {
        flattenArtifacts(art.children, art.linked_requirement_ids);
      }
    }
  };
  flattenArtifacts(raw.delivery_artifacts);

  // Calculate completeness: how many nodes have links
  const allNodes = [
    ...businessObjectives,
    ...kpis,
    ...dataRequirements,
    ...deliveryArtifacts,
  ];
  const linkedCount = allNodes.filter((n) => n.linked_ids.length > 0).length;
  const completeness_score =
    allNodes.length > 0
      ? Math.round((linkedCount / allNodes.length) * 100)
      : 0;

  return {
    business_objectives: businessObjectives,
    kpis,
    data_requirements: dataRequirements,
    delivery_artifacts: deliveryArtifacts,
    completeness_score,
  };
}

export async function getTraceability(
  workspaceId: string
): Promise<TraceabilityData> {
  const raw = await request<TraceabilityResponse>(
    `/workspaces/${workspaceId}/traceability`
  );
  return transformTraceability(raw);
}
