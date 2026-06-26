"""Vercel serverless entry point — exposes the FastAPI app."""

import sys
import os

# Add parent directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force SQLite to use /tmp on Vercel (ephemeral but writable)
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/data.db"

from main import app  # noqa: E402
