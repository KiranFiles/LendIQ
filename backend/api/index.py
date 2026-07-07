"""
Vercel serverless entry point for the LendIQ FastAPI backend.

Vercel's @vercel/python runtime discovers the `app` object from this file
and serves it as a serverless function. All routes are rewritten here via
vercel.json so the full FastAPI router is available.

Cold-start note: the LendingIntelligenceEngine trains both ML models and
scores the synthetic portfolio on first import (~2–3 s). Subsequent warm
invocations within the same Lambda instance reuse the cached engine.
"""
import sys
import os

# Make the backend/app package importable (Vercel runs from repo root)
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app  # noqa: F401  — Vercel picks up `app` from here

# Vercel expects the ASGI app to be named `app` at module level.
__all__ = ["app"]
