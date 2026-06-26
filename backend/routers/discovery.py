"""Discovery endpoints — submit text, AI extracts structured data."""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace, Discovery
from schemas import DiscoverRequest, DiscoveryResponse, DiscoveryUpdate
from ai.claude_service import claude_service

router = APIRouter(tags=["Discovery"])


@router.post(
    "/workspaces/{workspace_id}/discover",
    response_model=DiscoveryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_discovery(workspace_id: str, body: DiscoverRequest, db: Session = Depends(get_db)):
    """Submit raw meeting notes or transcript text. AI extracts structured business discovery data."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Call Claude to extract structured data
    extracted = await claude_service.extract_discovery(body.raw_input)

    discovery = Discovery(
        workspace_id=workspace_id,
        title=body.title,
        raw_input=body.raw_input,
    )
    discovery.set_json("business_objectives", extracted.get("business_objectives", []))
    discovery.set_json("stakeholders", extracted.get("stakeholders", []))
    discovery.set_json("kpis", extracted.get("kpis", []))
    discovery.set_json("assumptions", extracted.get("assumptions", []))
    discovery.set_json("risks", extracted.get("risks", []))
    discovery.set_json("success_metrics", extracted.get("success_metrics", []))

    db.add(discovery)
    db.commit()
    db.refresh(discovery)

    return _discovery_to_response(discovery)


@router.get("/workspaces/{workspace_id}/discoveries", response_model=list[DiscoveryResponse])
def list_discoveries(workspace_id: str, db: Session = Depends(get_db)):
    """List all discoveries for a workspace."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    discoveries = (
        db.query(Discovery)
        .filter(Discovery.workspace_id == workspace_id)
        .order_by(Discovery.created_at.desc())
        .all()
    )
    return [_discovery_to_response(d) for d in discoveries]


@router.get("/discoveries/{discovery_id}", response_model=DiscoveryResponse)
def get_discovery(discovery_id: str, db: Session = Depends(get_db)):
    """Get a single discovery with all extracted data."""
    discovery = db.query(Discovery).filter(Discovery.id == discovery_id).first()
    if not discovery:
        raise HTTPException(status_code=404, detail="Discovery not found")
    return _discovery_to_response(discovery)


@router.put("/discoveries/{discovery_id}", response_model=DiscoveryResponse)
def update_discovery(discovery_id: str, body: DiscoveryUpdate, db: Session = Depends(get_db)):
    """Update discovery fields. AI outputs are editable by the user."""
    discovery = db.query(Discovery).filter(Discovery.id == discovery_id).first()
    if not discovery:
        raise HTTPException(status_code=404, detail="Discovery not found")

    if body.title is not None:
        discovery.title = body.title
    if body.business_objectives is not None:
        discovery.set_json("business_objectives", body.business_objectives)
    if body.stakeholders is not None:
        discovery.set_json("stakeholders", body.stakeholders)
    if body.kpis is not None:
        discovery.set_json("kpis", body.kpis)
    if body.assumptions is not None:
        discovery.set_json("assumptions", body.assumptions)
    if body.risks is not None:
        discovery.set_json("risks", body.risks)
    if body.success_metrics is not None:
        discovery.set_json("success_metrics", body.success_metrics)

    db.commit()
    db.refresh(discovery)
    return _discovery_to_response(discovery)


def _discovery_to_response(d: Discovery) -> DiscoveryResponse:
    """Convert a Discovery ORM object to a response schema."""
    return DiscoveryResponse(
        id=d.id,
        workspace_id=d.workspace_id,
        title=d.title,
        raw_input=d.raw_input,
        business_objectives=d.get_json("business_objectives"),
        stakeholders=d.get_json("stakeholders"),
        kpis=d.get_json("kpis"),
        assumptions=d.get_json("assumptions"),
        risks=d.get_json("risks"),
        success_metrics=d.get_json("success_metrics"),
        created_at=d.created_at,
    )
