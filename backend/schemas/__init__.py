"""Pydantic request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Workspace
# ---------------------------------------------------------------------------

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceListItem(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    discovery_count: int = 0
    requirement_count: int = 0
    artifact_count: int = 0

    model_config = {"from_attributes": True}


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceListItem]


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

class KPI(BaseModel):
    name: str
    description: str = ""
    target: str = ""
    measurement: str = ""


class Stakeholder(BaseModel):
    name: str
    role: str = ""
    interest: str = ""


class DiscoverRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    raw_input: str = Field(..., min_length=10)


class DiscoveryResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    raw_input: str
    business_objectives: list[Any] = []
    stakeholders: list[Any] = []
    kpis: list[Any] = []
    assumptions: list[Any] = []
    risks: list[Any] = []
    success_metrics: list[Any] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class DiscoveryUpdate(BaseModel):
    title: Optional[str] = None
    business_objectives: Optional[list[Any]] = None
    stakeholders: Optional[list[Any]] = None
    kpis: Optional[list[Any]] = None
    assumptions: Optional[list[Any]] = None
    risks: Optional[list[Any]] = None
    success_metrics: Optional[list[Any]] = None


# ---------------------------------------------------------------------------
# DataRequirement
# ---------------------------------------------------------------------------

class DataRequirementResponse(BaseModel):
    id: str
    workspace_id: str
    discovery_id: Optional[str] = None
    business_entity: str
    data_points: list[Any] = []
    source_systems: list[Any] = []
    dependencies: list[Any] = []
    gaps: list[Any] = []
    priority: str = "medium"
    status: str = "identified"
    created_at: datetime

    model_config = {"from_attributes": True}


class DataRequirementUpdate(BaseModel):
    business_entity: Optional[str] = None
    data_points: Optional[list[Any]] = None
    source_systems: Optional[list[Any]] = None
    dependencies: Optional[list[Any]] = None
    gaps: Optional[list[Any]] = None
    priority: Optional[str] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# DeliveryArtifact
# ---------------------------------------------------------------------------

class DeliveryArtifactResponse(BaseModel):
    id: str
    workspace_id: str
    type: str
    title: str
    description: str = ""
    acceptance_criteria: list[Any] = []
    dependencies: list[Any] = []
    priority: str = "medium"
    status: str = "planned"
    parent_id: Optional[str] = None
    linked_requirement_ids: list[Any] = []
    children: list[DeliveryArtifactResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class DeliveryArtifactUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    acceptance_criteria: Optional[list[Any]] = None
    dependencies: Optional[list[Any]] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    linked_requirement_ids: Optional[list[Any]] = None


# ---------------------------------------------------------------------------
# ImpactAnalysis
# ---------------------------------------------------------------------------

class ImpactAnalysisRequest(BaseModel):
    change_description: str = Field(..., min_length=10)


class ImpactAnalysisResponse(BaseModel):
    id: str
    workspace_id: str
    change_description: str
    impacted_kpis: list[Any] = []
    impacted_requirements: list[Any] = []
    impacted_stories: list[Any] = []
    risk_assessment: str = ""
    recommendations: list[Any] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Traceability
# ---------------------------------------------------------------------------

class TraceabilityKPI(BaseModel):
    name: str
    description: str = ""
    target: str = ""
    measurement: str = ""
    linked_requirement_ids: list[str] = []


class TraceabilityDiscovery(BaseModel):
    id: str
    title: str
    business_objectives: list[Any] = []
    kpis: list[TraceabilityKPI] = []
    stakeholders: list[Any] = []


class TraceabilityRequirement(BaseModel):
    id: str
    business_entity: str
    data_points: list[Any] = []
    priority: str
    status: str
    discovery_id: Optional[str] = None
    linked_artifact_ids: list[str] = []


class TraceabilityArtifact(BaseModel):
    id: str
    type: str
    title: str
    status: str
    priority: str
    linked_requirement_ids: list[Any] = []
    children: list[TraceabilityArtifact] = []


class TraceabilityResponse(BaseModel):
    workspace_id: str
    workspace_name: str
    discoveries: list[TraceabilityDiscovery] = []
    data_requirements: list[TraceabilityRequirement] = []
    delivery_artifacts: list[TraceabilityArtifact] = []
    chain_summary: dict = {}
