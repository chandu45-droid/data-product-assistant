"""SQLAlchemy ORM models for the Data Product Discovery & Delivery Assistant."""

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


def _new_id() -> str:
    return uuid.uuid4().hex


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Workspace
# ---------------------------------------------------------------------------

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(32), primary_key=True, default=_new_id)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    discoveries = relationship("Discovery", back_populates="workspace", cascade="all, delete-orphan")
    data_requirements = relationship("DataRequirement", back_populates="workspace", cascade="all, delete-orphan")
    delivery_artifacts = relationship("DeliveryArtifact", back_populates="workspace", cascade="all, delete-orphan")
    impact_analyses = relationship("ImpactAnalysis", back_populates="workspace", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

class Discovery(Base):
    __tablename__ = "discoveries"

    id = Column(String(32), primary_key=True, default=_new_id)
    workspace_id = Column(String(32), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    raw_input = Column(Text, nullable=False)
    business_objectives = Column(Text, default="[]")  # JSON
    stakeholders = Column(Text, default="[]")
    kpis = Column(Text, default="[]")
    assumptions = Column(Text, default="[]")
    risks = Column(Text, default="[]")
    success_metrics = Column(Text, default="[]")
    created_at = Column(DateTime, default=_utcnow)

    workspace = relationship("Workspace", back_populates="discoveries")
    data_requirements = relationship("DataRequirement", back_populates="discovery")

    # JSON helpers
    def get_json(self, field: str) -> list | dict:
        raw = getattr(self, field)
        if raw is None:
            return []
        return json.loads(raw) if isinstance(raw, str) else raw

    def set_json(self, field: str, value) -> None:
        setattr(self, field, json.dumps(value))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "title": self.title,
            "raw_input": self.raw_input,
            "business_objectives": self.get_json("business_objectives"),
            "stakeholders": self.get_json("stakeholders"),
            "kpis": self.get_json("kpis"),
            "assumptions": self.get_json("assumptions"),
            "risks": self.get_json("risks"),
            "success_metrics": self.get_json("success_metrics"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# DataRequirement
# ---------------------------------------------------------------------------

class DataRequirement(Base):
    __tablename__ = "data_requirements"

    id = Column(String(32), primary_key=True, default=_new_id)
    workspace_id = Column(String(32), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    discovery_id = Column(String(32), ForeignKey("discoveries.id", ondelete="SET NULL"), nullable=True)
    business_entity = Column(String(255), nullable=False)
    data_points = Column(Text, default="[]")
    source_systems = Column(Text, default="[]")
    dependencies = Column(Text, default="[]")
    gaps = Column(Text, default="[]")
    priority = Column(String(20), default="medium")
    status = Column(String(30), default="identified")
    created_at = Column(DateTime, default=_utcnow)

    workspace = relationship("Workspace", back_populates="data_requirements")
    discovery = relationship("Discovery", back_populates="data_requirements")

    def get_json(self, field: str) -> list | dict:
        raw = getattr(self, field)
        if raw is None:
            return []
        return json.loads(raw) if isinstance(raw, str) else raw

    def set_json(self, field: str, value) -> None:
        setattr(self, field, json.dumps(value))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "discovery_id": self.discovery_id,
            "business_entity": self.business_entity,
            "data_points": self.get_json("data_points"),
            "source_systems": self.get_json("source_systems"),
            "dependencies": self.get_json("dependencies"),
            "gaps": self.get_json("gaps"),
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# DeliveryArtifact
# ---------------------------------------------------------------------------

class DeliveryArtifact(Base):
    __tablename__ = "delivery_artifacts"

    id = Column(String(32), primary_key=True, default=_new_id)
    workspace_id = Column(String(32), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(20), nullable=False)  # epic / feature / story
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    acceptance_criteria = Column(Text, default="[]")
    dependencies = Column(Text, default="[]")
    priority = Column(String(20), default="medium")
    status = Column(String(30), default="planned")
    parent_id = Column(String(32), ForeignKey("delivery_artifacts.id", ondelete="SET NULL"), nullable=True)
    linked_requirement_ids = Column(Text, default="[]")
    created_at = Column(DateTime, default=_utcnow)

    workspace = relationship("Workspace", back_populates="delivery_artifacts")
    children = relationship("DeliveryArtifact", backref="parent", remote_side=[id], cascade="all")

    def get_json(self, field: str) -> list | dict:
        raw = getattr(self, field)
        if raw is None:
            return []
        return json.loads(raw) if isinstance(raw, str) else raw

    def set_json(self, field: str, value) -> None:
        setattr(self, field, json.dumps(value))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "acceptance_criteria": self.get_json("acceptance_criteria"),
            "dependencies": self.get_json("dependencies"),
            "priority": self.priority,
            "status": self.status,
            "parent_id": self.parent_id,
            "linked_requirement_ids": self.get_json("linked_requirement_ids"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# ImpactAnalysis
# ---------------------------------------------------------------------------

class ImpactAnalysis(Base):
    __tablename__ = "impact_analyses"

    id = Column(String(32), primary_key=True, default=_new_id)
    workspace_id = Column(String(32), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    change_description = Column(Text, nullable=False)
    impacted_kpis = Column(Text, default="[]")
    impacted_requirements = Column(Text, default="[]")
    impacted_stories = Column(Text, default="[]")
    risk_assessment = Column(Text, default="")
    recommendations = Column(Text, default="[]")
    created_at = Column(DateTime, default=_utcnow)

    workspace = relationship("Workspace", back_populates="impact_analyses")

    def get_json(self, field: str) -> list | dict:
        raw = getattr(self, field)
        if raw is None:
            return []
        return json.loads(raw) if isinstance(raw, str) else raw

    def set_json(self, field: str, value) -> None:
        setattr(self, field, json.dumps(value))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "change_description": self.change_description,
            "impacted_kpis": self.get_json("impacted_kpis"),
            "impacted_requirements": self.get_json("impacted_requirements"),
            "impacted_stories": self.get_json("impacted_stories"),
            "risk_assessment": self.risk_assessment,
            "recommendations": self.get_json("recommendations"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
