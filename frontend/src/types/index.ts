// ── Workspace ──────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  discovery_count?: number;
  requirement_count?: number;
  artifact_count?: number;
  impact_analysis_count?: number;
}

export interface CreateWorkspacePayload {
  name: string;
  description: string;
}

// ── Discovery ──────────────────────────────────────────────────────
export interface BusinessObjective {
  name: string;
  description: string;
}

export interface Stakeholder {
  name: string;
  role: string;
  interest: string;
}

export interface KPI {
  name: string;
  description: string;
  target: string;
  measurement: string;
}

export interface Discovery {
  id: string;
  workspace_id: string;
  title: string;
  raw_input: string;
  business_objectives: BusinessObjective[];
  stakeholders: Stakeholder[];
  kpis: KPI[];
  assumptions: string[];
  risks: string[];
  success_metrics: string[];
  created_at: string;
}

export interface DiscoverPayload {
  title: string;
  raw_input: string;
}

export interface UpdateDiscoveryPayload {
  title?: string;
  business_objectives?: BusinessObjective[];
  stakeholders?: Stakeholder[];
  kpis?: KPI[];
  assumptions?: string[];
  risks?: string[];
  success_metrics?: string[];
}

// ── Data Requirements ──────────────────────────────────────────────
export type RequirementPriority = "critical" | "high" | "medium" | "low";
export type RequirementStatus =
  | "identified"
  | "draft"
  | "in-progress"
  | "validated"
  | "blocked";

export interface DataRequirement {
  id: string;
  workspace_id: string;
  discovery_id: string | null;
  business_entity: string;
  data_points: string[];
  source_systems: string[];
  dependencies: string[];
  gaps: string[];
  priority: RequirementPriority;
  status: RequirementStatus;
  created_at: string;
}

export interface UpdateDataRequirementPayload {
  business_entity?: string;
  data_points?: string[];
  source_systems?: string[];
  dependencies?: string[];
  gaps?: string[];
  priority?: RequirementPriority;
  status?: RequirementStatus;
}

// ── Delivery Artifacts ─────────────────────────────────────────────
export type ArtifactType = "epic" | "feature" | "story";
export type ArtifactStatus =
  | "planned"
  | "draft"
  | "in-progress"
  | "done"
  | "blocked";

export interface DeliveryArtifact {
  id: string;
  workspace_id: string;
  type: ArtifactType;
  title: string;
  description: string;
  acceptance_criteria: string[];
  dependencies: string[];
  priority: RequirementPriority;
  status: ArtifactStatus;
  parent_id: string | null;
  linked_requirement_ids: string[];
  children?: DeliveryArtifact[];
  created_at: string;
}

export interface UpdateDeliveryArtifactPayload {
  title?: string;
  description?: string;
  acceptance_criteria?: string[];
  dependencies?: string[];
  priority?: RequirementPriority;
  status?: ArtifactStatus;
  linked_requirement_ids?: string[];
}

// ── Impact Analysis ────────────────────────────────────────────────
export interface ImpactedKPI {
  kpi_name: string;
  impact: string;
  explanation: string;
}

export interface ImpactedRequirement {
  requirement: string;
  impact: string;
  explanation: string;
}

export interface ImpactedStory {
  story: string;
  impact: string;
  explanation: string;
}

export interface ImpactAnalysis {
  id: string;
  workspace_id: string;
  change_description: string;
  impacted_kpis: ImpactedKPI[];
  impacted_requirements: ImpactedRequirement[];
  impacted_stories: ImpactedStory[];
  risk_assessment: string;
  recommendations: string[];
  created_at: string;
}

export interface ImpactAnalysisPayload {
  change_description: string;
}

// ── Traceability ───────────────────────────────────────────────────

// Frontend UI types (powers the 4-column SVG connector visualization)
export interface TraceNode {
  id: string;
  name: string;
  type: string;
  status?: string;
  linked_ids: string[];
}

export interface TraceabilityData {
  business_objectives: TraceNode[];
  kpis: TraceNode[];
  data_requirements: TraceNode[];
  delivery_artifacts: TraceNode[];
  completeness_score: number;
}

// Backend response types (for transform layer)
export interface TraceabilityKPIResponse {
  name: string;
  description: string;
  target: string;
  measurement: string;
  linked_requirement_ids: string[];
}

export interface TraceabilityDiscoveryResponse {
  id: string;
  title: string;
  business_objectives: BusinessObjective[];
  kpis: TraceabilityKPIResponse[];
  stakeholders: Stakeholder[];
}

export interface TraceabilityRequirementResponse {
  id: string;
  business_entity: string;
  data_points: string[];
  priority: string;
  status: string;
  discovery_id: string | null;
  linked_artifact_ids: string[];
}

export interface TraceabilityArtifactResponse {
  id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  linked_requirement_ids: string[];
  children: TraceabilityArtifactResponse[];
}

export interface TraceabilityResponse {
  workspace_id: string;
  workspace_name: string;
  discoveries: TraceabilityDiscoveryResponse[];
  data_requirements: TraceabilityRequirementResponse[];
  delivery_artifacts: TraceabilityArtifactResponse[];
  chain_summary: Record<string, unknown>;
}

// ── API Response Wrappers ──────────────────────────────────────────
export interface ApiError {
  detail: string;
}
