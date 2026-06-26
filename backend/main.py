"""Data Product Discovery & Delivery Assistant API — FastAPI entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers import workspaces, discovery, requirements, delivery, impact, traceability


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    init_db()
    yield


app = FastAPI(
    title="Data Product Discovery & Delivery Assistant API",
    description=(
        "AI-augmented Business Analyst tool that transforms vague business discussions "
        "into structured, traceable data product requirements and delivery plans."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers — all under /api prefix
app.include_router(workspaces.router, prefix="/api")
app.include_router(discovery.router, prefix="/api")
app.include_router(requirements.router, prefix="/api")
app.include_router(delivery.router, prefix="/api")
app.include_router(impact.router, prefix="/api")
app.include_router(traceability.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint — returns API status and configuration info."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "ai_enabled": bool(settings.ANTHROPIC_API_KEY),
        "database": settings.DATABASE_URL.split("///")[-1] if "///" in settings.DATABASE_URL else settings.DATABASE_URL,
    }
