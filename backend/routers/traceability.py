"""Traceability endpoint — full chain from discoveries to delivery artifacts."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace, Discovery, DataRequirement, DeliveryArtifact
from schemas import (
    TraceabilityResponse,
    TraceabilityDiscovery,
    TraceabilityKPI,
    TraceabilityRequirement,
    TraceabilityArtifact,
)

router = APIRouter(tags=["Traceability"])


@router.get("/workspaces/{workspace_id}/traceability", response_model=TraceabilityResponse)
def get_traceability(workspace_id: str, db: Session = Depends(get_db)):
    """Build and return the full traceability chain for a workspace.

    Chain: Discoveries -> KPIs -> Data Requirements -> Delivery Artifacts
    Includes all linkages between entities.
    """
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Gather all data
    discoveries = db.query(Discovery).filter(Discovery.workspace_id == workspace_id).all()
    requirements = db.query(DataRequirement).filter(DataRequirement.workspace_id == workspace_id).all()
    artifacts = db.query(DeliveryArtifact).filter(DeliveryArtifact.workspace_id == workspace_id).all()

    # Build requirement index for linking
    req_by_id = {r.id: r for r in requirements}

    # Build artifact lookup by linked requirement IDs
    artifact_by_req: dict[str, list[str]] = {}
    for a in artifacts:
        linked = a.get_json("linked_requirement_ids")
        for req_id in linked:
            artifact_by_req.setdefault(req_id, []).append(a.id)

    # Build discovery traceability
    trace_discoveries = []
    for d in discoveries:
        kpis_raw = d.get_json("kpis")
        # Find which requirements are linked to this discovery
        linked_reqs = [r for r in requirements if r.discovery_id == d.id]
        linked_req_ids = [r.id for r in linked_reqs]

        trace_kpis = []
        for kpi in kpis_raw:
            trace_kpis.append(TraceabilityKPI(
                name=kpi.get("name", ""),
                description=kpi.get("description", ""),
                target=kpi.get("target", ""),
                measurement=kpi.get("measurement", ""),
                linked_requirement_ids=linked_req_ids,
            ))

        trace_discoveries.append(TraceabilityDiscovery(
            id=d.id,
            title=d.title,
            business_objectives=d.get_json("business_objectives"),
            kpis=trace_kpis,
            stakeholders=d.get_json("stakeholders"),
        ))

    # Build requirement traceability
    trace_requirements = []
    for r in requirements:
        # Find which artifacts link to this requirement
        linked_artifacts = artifact_by_req.get(r.id, [])
        # Also find artifacts that don't have explicit links but belong to this workspace
        trace_requirements.append(TraceabilityRequirement(
            id=r.id,
            business_entity=r.business_entity,
            data_points=r.get_json("data_points"),
            priority=r.priority,
            status=r.status,
            discovery_id=r.discovery_id,
            linked_artifact_ids=linked_artifacts,
        ))

    # Build artifact traceability (tree structure)
    top_level = [a for a in artifacts if a.parent_id is None]
    artifacts_by_parent: dict[str, list[DeliveryArtifact]] = {}
    for a in artifacts:
        if a.parent_id:
            artifacts_by_parent.setdefault(a.parent_id, []).append(a)

    def _build_artifact_tree(artifact: DeliveryArtifact) -> TraceabilityArtifact:
        children = artifacts_by_parent.get(artifact.id, [])
        return TraceabilityArtifact(
            id=artifact.id,
            type=artifact.type,
            title=artifact.title,
            status=artifact.status,
            priority=artifact.priority,
            linked_requirement_ids=artifact.get_json("linked_requirement_ids"),
            children=[_build_artifact_tree(c) for c in children],
        )

    trace_artifacts = [_build_artifact_tree(a) for a in top_level]

    # Summary
    chain_summary = {
        "total_discoveries": len(discoveries),
        "total_kpis": sum(len(d.get_json("kpis")) for d in discoveries),
        "total_requirements": len(requirements),
        "total_artifacts": len(artifacts),
        "total_epics": len([a for a in artifacts if a.type == "epic"]),
        "total_features": len([a for a in artifacts if a.type == "feature"]),
        "total_stories": len([a for a in artifacts if a.type == "story"]),
        "requirements_with_gaps": len([r for r in requirements if r.get_json("gaps")]),
        "coverage": {
            "requirements_linked_to_discoveries": len([r for r in requirements if r.discovery_id]),
            "requirements_total": len(requirements),
        },
    }

    return TraceabilityResponse(
        workspace_id=workspace_id,
        workspace_name=ws.name,
        discoveries=trace_discoveries,
        data_requirements=trace_requirements,
        delivery_artifacts=trace_artifacts,
        chain_summary=chain_summary,
    )
