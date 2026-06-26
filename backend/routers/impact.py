"""Change Impact Analysis endpoints — AI analyzes ripple effects of proposed changes."""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace, Discovery, DataRequirement, DeliveryArtifact, ImpactAnalysis
from schemas import ImpactAnalysisRequest, ImpactAnalysisResponse
from ai.claude_service import claude_service

router = APIRouter(tags=["Impact Analysis"])


@router.post(
    "/workspaces/{workspace_id}/impact-analysis",
    response_model=ImpactAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_impact(workspace_id: str, body: ImpactAnalysisRequest, db: Session = Depends(get_db)):
    """Submit a change description and AI analyzes its impact on KPIs, requirements, and stories."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Gather current workspace state for context
    discoveries = db.query(Discovery).filter(Discovery.workspace_id == workspace_id).all()
    requirements = db.query(DataRequirement).filter(DataRequirement.workspace_id == workspace_id).all()
    artifacts = db.query(DeliveryArtifact).filter(DeliveryArtifact.workspace_id == workspace_id).all()

    current_state = {
        "discoveries": [d.to_dict() for d in discoveries],
        "data_requirements": [r.to_dict() for r in requirements],
        "delivery_artifacts": [a.to_dict() for a in artifacts],
    }

    # Call Claude to analyze impact
    analysis = await claude_service.analyze_impact(body.change_description, current_state)

    impact = ImpactAnalysis(
        workspace_id=workspace_id,
        change_description=body.change_description,
        risk_assessment=analysis.get("risk_assessment", ""),
    )
    impact.set_json("impacted_kpis", analysis.get("impacted_kpis", []))
    impact.set_json("impacted_requirements", analysis.get("impacted_requirements", []))
    impact.set_json("impacted_stories", analysis.get("impacted_stories", []))
    impact.set_json("recommendations", analysis.get("recommendations", []))

    db.add(impact)
    db.commit()
    db.refresh(impact)

    return _impact_to_response(impact)


@router.get("/workspaces/{workspace_id}/impact-analyses", response_model=list[ImpactAnalysisResponse])
def list_impact_analyses(workspace_id: str, db: Session = Depends(get_db)):
    """List all past impact analyses for a workspace."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    analyses = (
        db.query(ImpactAnalysis)
        .filter(ImpactAnalysis.workspace_id == workspace_id)
        .order_by(ImpactAnalysis.created_at.desc())
        .all()
    )
    return [_impact_to_response(a) for a in analyses]


def _impact_to_response(ia: ImpactAnalysis) -> ImpactAnalysisResponse:
    """Convert an ImpactAnalysis ORM object to a response schema."""
    return ImpactAnalysisResponse(
        id=ia.id,
        workspace_id=ia.workspace_id,
        change_description=ia.change_description,
        impacted_kpis=ia.get_json("impacted_kpis"),
        impacted_requirements=ia.get_json("impacted_requirements"),
        impacted_stories=ia.get_json("impacted_stories"),
        risk_assessment=ia.risk_assessment,
        recommendations=ia.get_json("recommendations"),
        created_at=ia.created_at,
    )
