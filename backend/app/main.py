from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .ml_engine import get_engine
from .models import AnalyticsSummary, CustomerDetail, LeadSummary

app = FastAPI(
    title="Retail Lending Lead Intelligence API",
    description=(
        "Track 02 - Retail Lending / Lead Generation / Behavioural "
        "Analytics. Identifies eligible, income-verified, genuinely "
        "interested retail lending prospects from transaction and "
        "behavioural data."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    # Trains both ML models and scores the full synthetic portfolio once.
    get_engine()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/loan-types")
def loan_types():
    return {"loan_types": config.LOAN_TYPES}


@app.get("/api/leads", response_model=list[LeadSummary])
def get_leads(
    loan_type: Optional[str] = Query(default=None, enum=config.LOAN_TYPES),
    min_score: float = Query(default=0.0, ge=0.0, le=1.0),
    surfaced_only: bool = Query(default=True),
    limit: int = Query(default=200, ge=1, le=1200),
):
    engine = get_engine()
    return engine.get_leads(
        loan_type=loan_type,
        min_score=min_score,
        surfaced_only=surfaced_only,
        limit=limit,
    )


@app.get("/api/leads/{customer_id}", response_model=CustomerDetail)
def get_lead_detail(customer_id: str):
    engine = get_engine()
    detail = engine.get_customer_detail(customer_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return detail


@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary():
    engine = get_engine()
    return engine.get_analytics_summary()


@app.post("/api/engine/refresh")
def refresh_engine(seed: Optional[int] = None):
    """Regenerates synthetic data and retrains both models (demo utility)."""
    import app.ml_engine as ml_engine_module

    ml_engine_module.engine = ml_engine_module.LendingIntelligenceEngine(
        seed=seed if seed is not None else config.RANDOM_SEED
    )
    return {"status": "retrained", "seed": seed if seed is not None else config.RANDOM_SEED}
