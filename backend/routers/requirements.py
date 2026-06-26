"""Data Requirements endpoints — AI generates from discoveries, user can edit."""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace, Discovery, DataRequirement
from schemas import DataRequirementResponse, DataRequirementUpdate
from ai.claude_service import claude_service

router = APIRouter(tags=["Data Requirements"])


@router.post(
    "/workspaces/{workspace_id}/data-requirements/generate",
    response_model=list[DataRequirementResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_requirements(workspace_id: str, db: Session = Depends(get_db)):
    """Gather all discoveries for the workspace and generate data requirements using AI."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    discoveries = db.query(Discovery).filter(Discovery.workspace_id == workspace_id).all()
    if not discoveries:
        raise HTTPException(status_code=400, detail="No discoveries found. Run discovery first.")

    discovery_dicts = [d.to_dict() for d in discoveries]

    # Call Claude to generate requirements
    generated = await claude_service.generate_data_requirements(discovery_dicts)

    # Link to the first discovery if only one exists
    default_discovery_id = discoveries[0].id if len(discoveries) == 1 else None

    created = []
    for req_data in generated:
        req = DataRequirement(
            workspace_id=workspace_id,
            discovery_id=default_discovery_id,
            business_entity=req_data.get("business_entity", "Unknown Entity"),
        )
        req.set_json("data_points", req_data.get("data_points", []))
        req.set_json("source_systems", req_data.get("source_systems", []))
        req.set_json("dependencies", req_data.get("dependencies", []))
        req.set_json("gaps", req_data.get("gaps", []))
        req.priority = req_data.get("priority", "medium")
        req.status = "identified"

        db.add(req)
        created.append(req)

    db.commit()
    for req in created:
        db.refresh(req)

    return [_requirement_to_response(r) for r in created]


@router.get("/workspaces/{workspace_id}/data-requirements", response_model=list[DataRequirementResponse])
def list_requirements(workspace_id: str, db: Session = Depends(get_db)):
    """List all data requirements for a workspace."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    requirements = (
        db.query(DataRequirement)
        .filter(DataRequirement.workspace_id == workspace_id)
        .order_by(DataRequirement.created_at)
        .all()
    )
    return [_requirement_to_response(r) for r in requirements]


@router.put("/data-requirements/{requirement_id}", response_model=DataRequirementResponse)
def update_requirement(requirement_id: str, body: DataRequirementUpdate, db: Session = Depends(get_db)):
    """Update a data requirement. AI outputs are editable by the user."""
    req = db.query(DataRequirement).filter(DataRequirement.id == requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Data requirement not found")

    if body.business_entity is not None:
        req.business_entity = body.business_entity
    if body.data_points is not None:
        req.set_json("data_points", body.data_points)
    if body.source_systems is not None:
        req.set_json("source_systems", body.source_systems)
    if body.dependencies is not None:
        req.set_json("dependencies", body.dependencies)
    if body.gaps is not None:
        req.set_json("gaps", body.gaps)
    if body.priority is not None:
        req.priority = body.priority
    if body.status is not None:
        req.status = body.status

    db.commit()
    db.refresh(req)
    return _requirement_to_response(req)


def _requirement_to_response(r: DataRequirement) -> DataRequirementResponse:
    """Convert a DataRequirement ORM object to a response schema."""
    return DataRequirementResponse(
        id=r.id,
        workspace_id=r.workspace_id,
        discovery_id=r.discovery_id,
        business_entity=r.business_entity,
        data_points=r.get_json("data_points"),
        source_systems=r.get_json("source_systems"),
        dependencies=r.get_json("dependencies"),
        gaps=r.get_json("gaps"),
        priority=r.priority,
        status=r.status,
        created_at=r.created_at,
    )
