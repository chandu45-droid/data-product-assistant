"""Delivery Plan endpoints — AI generates epics/features/stories, user can edit."""

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace, Discovery, DataRequirement, DeliveryArtifact
from schemas import DeliveryArtifactResponse, DeliveryArtifactUpdate
from ai.claude_service import claude_service

router = APIRouter(tags=["Delivery Planning"])


@router.post(
    "/workspaces/{workspace_id}/delivery-plan/generate",
    response_model=list[DeliveryArtifactResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_delivery_plan(workspace_id: str, db: Session = Depends(get_db)):
    """Generate a hierarchical delivery plan (epics > features > stories) from requirements and discoveries."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    requirements = db.query(DataRequirement).filter(DataRequirement.workspace_id == workspace_id).all()
    if not requirements:
        raise HTTPException(status_code=400, detail="No data requirements found. Generate requirements first.")

    discoveries = db.query(Discovery).filter(Discovery.workspace_id == workspace_id).all()

    req_dicts = [r.to_dict() for r in requirements]
    disc_dicts = [d.to_dict() for d in discoveries]

    # Call Claude to generate the delivery plan
    plan = await claude_service.generate_delivery_plan(req_dicts, disc_dicts)

    # Flatten the hierarchical plan into DB records with parent_id references
    created = []
    for epic_data in plan:
        epic = _create_artifact(db, workspace_id, epic_data, parent_id=None)
        db.add(epic)
        db.flush()  # Get the epic ID
        created.append(epic)

        for feature_data in epic_data.get("features", []):
            feature = _create_artifact(db, workspace_id, feature_data, parent_id=epic.id)
            db.add(feature)
            db.flush()
            created.append(feature)

            for story_data in feature_data.get("stories", []):
                story = _create_artifact(db, workspace_id, story_data, parent_id=feature.id)
                db.add(story)
                created.append(story)

    db.commit()
    for artifact in created:
        db.refresh(artifact)

    # Return only top-level (epics) with tree structure
    epics = [a for a in created if a.parent_id is None]
    return [_artifact_tree(a, db) for a in epics]


@router.get("/workspaces/{workspace_id}/delivery-artifacts", response_model=list[DeliveryArtifactResponse])
def list_delivery_artifacts(workspace_id: str, db: Session = Depends(get_db)):
    """List delivery artifacts as a tree structure (epics > features > stories)."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Get top-level artifacts (epics — no parent)
    epics = (
        db.query(DeliveryArtifact)
        .filter(
            DeliveryArtifact.workspace_id == workspace_id,
            DeliveryArtifact.parent_id.is_(None),
        )
        .order_by(DeliveryArtifact.created_at)
        .all()
    )
    return [_artifact_tree(epic, db) for epic in epics]


@router.put("/delivery-artifacts/{artifact_id}", response_model=DeliveryArtifactResponse)
def update_delivery_artifact(artifact_id: str, body: DeliveryArtifactUpdate, db: Session = Depends(get_db)):
    """Update a delivery artifact. AI outputs are editable by the user."""
    artifact = db.query(DeliveryArtifact).filter(DeliveryArtifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Delivery artifact not found")

    if body.title is not None:
        artifact.title = body.title
    if body.description is not None:
        artifact.description = body.description
    if body.acceptance_criteria is not None:
        artifact.set_json("acceptance_criteria", body.acceptance_criteria)
    if body.dependencies is not None:
        artifact.set_json("dependencies", body.dependencies)
    if body.priority is not None:
        artifact.priority = body.priority
    if body.status is not None:
        artifact.status = body.status
    if body.linked_requirement_ids is not None:
        artifact.set_json("linked_requirement_ids", body.linked_requirement_ids)

    db.commit()
    db.refresh(artifact)
    return _artifact_tree(artifact, db)


def _create_artifact(db: Session, workspace_id: str, data: dict, parent_id: str | None) -> DeliveryArtifact:
    """Create a DeliveryArtifact ORM object from a dict."""
    artifact = DeliveryArtifact(
        id=uuid.uuid4().hex,
        workspace_id=workspace_id,
        type=data.get("type", "story"),
        title=data.get("title", "Untitled"),
        description=data.get("description", ""),
        parent_id=parent_id,
        priority=data.get("priority", "medium"),
        status="planned",
    )
    artifact.set_json("acceptance_criteria", data.get("acceptance_criteria", []))
    artifact.set_json("dependencies", data.get("dependencies", []))
    artifact.set_json("linked_requirement_ids", data.get("linked_requirement_ids", []))
    return artifact


def _artifact_tree(artifact: DeliveryArtifact, db: Session) -> DeliveryArtifactResponse:
    """Recursively build the tree structure for a delivery artifact."""
    children = (
        db.query(DeliveryArtifact)
        .filter(DeliveryArtifact.parent_id == artifact.id)
        .order_by(DeliveryArtifact.created_at)
        .all()
    )
    return DeliveryArtifactResponse(
        id=artifact.id,
        workspace_id=artifact.workspace_id,
        type=artifact.type,
        title=artifact.title,
        description=artifact.description,
        acceptance_criteria=artifact.get_json("acceptance_criteria"),
        dependencies=artifact.get_json("dependencies"),
        priority=artifact.priority,
        status=artifact.status,
        parent_id=artifact.parent_id,
        linked_requirement_ids=artifact.get_json("linked_requirement_ids"),
        children=[_artifact_tree(c, db) for c in children],
        created_at=artifact.created_at,
    )
