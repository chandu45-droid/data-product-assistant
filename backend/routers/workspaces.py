"""Workspace CRUD endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace, Discovery, DataRequirement, DeliveryArtifact
from schemas import WorkspaceCreate, WorkspaceResponse, WorkspaceListItem, WorkspaceListResponse

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(body: WorkspaceCreate, db: Session = Depends(get_db)):
    """Create a new workspace for organizing a data product discovery project."""
    workspace = Workspace(name=body.name, description=body.description)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("", response_model=list[WorkspaceListItem])
def list_workspaces(db: Session = Depends(get_db)):
    """List all workspaces with summary counts of discoveries, requirements, and artifacts."""
    workspaces = db.query(Workspace).order_by(Workspace.updated_at.desc()).all()
    items = []
    for ws in workspaces:
        items.append(WorkspaceListItem(
            id=ws.id,
            name=ws.name,
            description=ws.description,
            created_at=ws.created_at,
            updated_at=ws.updated_at,
            discovery_count=db.query(Discovery).filter(Discovery.workspace_id == ws.id).count(),
            requirement_count=db.query(DataRequirement).filter(DataRequirement.workspace_id == ws.id).count(),
            artifact_count=db.query(DeliveryArtifact).filter(DeliveryArtifact.workspace_id == ws.id).count(),
        ))
    return items


@router.get("/{workspace_id}", response_model=WorkspaceListItem)
def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    """Get a single workspace with summary counts."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceListItem(
        id=ws.id,
        name=ws.name,
        description=ws.description,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        discovery_count=db.query(Discovery).filter(Discovery.workspace_id == ws.id).count(),
        requirement_count=db.query(DataRequirement).filter(DataRequirement.workspace_id == ws.id).count(),
        artifact_count=db.query(DeliveryArtifact).filter(DeliveryArtifact.workspace_id == ws.id).count(),
    )


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: str, db: Session = Depends(get_db)):
    """Delete a workspace and all its associated data (cascading delete)."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    db.delete(ws)
    db.commit()
    return None
