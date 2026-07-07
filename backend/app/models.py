from typing import Optional

from pydantic import BaseModel


class LeadSummary(BaseModel):
    customer_id: str
    occupation_type: str
    age: int
    declared_income: float
    estimated_income: float
    income_confidence_pct: float
    declared_vs_estimated_gap_pct: float
    credit_score: float
    recommended_product: Optional[str]
    repayment_capacity_score: float
    intent_score: float
    priority_score: float
    is_surfaced_lead: bool


class EligibilityCriterion(BaseModel):
    criterion: str
    required: str
    actual: str
    passed: bool


class BehaviouralSignals(BaseModel):
    avg_monthly_credit_inflow: float
    credit_inflow_regularity: float
    upi_txn_count_per_month: int
    loan_page_visits_30d: int
    emi_calculator_uses_30d: int
    days_since_last_inquiry: int
    existing_customer: bool


class CustomerDetail(BaseModel):
    customer_id: str
    occupation_type: str
    age: int
    declared_income: float
    estimated_income: float
    income_confidence_pct: float
    declared_vs_estimated_gap_pct: float
    credit_score: float
    existing_emi_outflow: float
    bounce_count_6m: int
    intent_score: float
    repayment_capacity_score: float
    priority_score: float
    recommended_product: Optional[str]
    is_surfaced_lead: bool
    eligibility: dict
    behavioural_signals: BehaviouralSignals


class AnalyticsSummary(BaseModel):
    total_customers_evaluated: int
    eligible_customers: int
    surfaced_leads: int
    achieved_conversion_rate_pct: float
    conversion_target_pct: float
    target_met: bool
    leads_by_product: dict
    income_model_metrics: Optional[dict]
    intent_model_metrics: Optional[dict]
    avg_declared_vs_estimated_gap_pct: float
