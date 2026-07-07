"""
Generates a synthetic "Account Aggregator + UPI + bureau + digital
behaviour" dataset that stands in for the real data sources (GST/AA/
core-banking/clickstream) a bank would connect in production.

The generator deliberately injects a gap between `declared_income`
(what the customer states in a form) and `true_income` (a latent
ground truth we treat as if it came from AA-verified bank statements
+ GST filings). The ML income model in ml_engine.py is trained to
recover `true_income` from transaction/behavioural features alone,
which is the crux of the "accurate assessment of borrowers' actual
income" requirement in the problem statement.
"""

import numpy as np
import pandas as pd

from .config import RANDOM_SEED, N_CUSTOMERS


def generate_customers(n: int = N_CUSTOMERS, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    occupation = rng.choice(
        ["salaried", "self_employed", "business_owner"],
        size=n,
        p=[0.55, 0.25, 0.20],
    )

    age = rng.integers(21, 62, size=n)

    # Latent true monthly income (what AA/GST data would reveal), lognormal
    base = rng.lognormal(mean=10.5, sigma=0.55, size=n)  # ~ INR 20k - 300k
    true_income = np.clip(base, 12_000, 500_000).round(-2)

    # Salaried customers have more regular credit inflow; self-employed/
    # business owners have lumpier, less regular inflow for the same income.
    regularity_noise = np.where(
        occupation == "salaried",
        rng.normal(0.08, 0.03, n),
        rng.normal(0.35, 0.12, n),
    )
    credit_inflow_regularity = np.clip(regularity_noise, 0.02, 0.9)

    # Declared income: self-reported, tends to be inflated, especially by
    # self-employed/business owners trying to qualify for larger loans.
    inflation_factor = np.where(
        occupation == "salaried",
        rng.normal(1.03, 0.06, n),
        rng.normal(1.35, 0.35, n),
    )
    declared_income = np.clip(true_income * inflation_factor, 10_000, 800_000).round(-2)

    # Average monthly credit inflow correlates with true income but with
    # observation noise (this is the feature the model actually sees).
    avg_monthly_credit_inflow = np.clip(
        true_income * rng.normal(0.97, 0.08, n), 8_000, 500_000
    ).round(-2)

    avg_monthly_debit = np.clip(
        avg_monthly_credit_inflow * rng.normal(0.72, 0.15, n), 4_000, 480_000
    ).round(-2)

    existing_emi_outflow = np.clip(
        avg_monthly_credit_inflow * rng.beta(1.5, 6, n), 0, 200_000
    ).round(-2)

    upi_txn_count_per_month = rng.integers(5, 220, size=n)
    upi_avg_ticket_size = np.clip(
        rng.lognormal(mean=6.0, sigma=0.7, size=n), 50, 20_000
    ).round(0)

    savings_balance_trend = rng.normal(0.02, 0.08, n)  # monthly % change

    bounce_count_6m = rng.poisson(
        lam=np.where(credit_inflow_regularity > 0.4, 0.6, 0.12)
    )

    credit_score = np.clip(
        rng.normal(700, 90, n) - bounce_count_6m * 15 + (true_income / 8000),
        300,
        900,
    ).round(0)

    existing_customer = rng.choice([0, 1], size=n, p=[0.4, 0.6])
    loan_page_visits_30d = rng.poisson(lam=2.2, size=n)
    emi_calculator_uses_30d = rng.poisson(lam=1.1, size=n)
    days_since_last_inquiry = rng.integers(0, 180, size=n)

    df = pd.DataFrame(
        {
            "customer_id": [f"CUST{i:05d}" for i in range(1, n + 1)],
            "age": age,
            "occupation_type": occupation,
            "declared_income": declared_income,
            "true_income": true_income,  # latent ground truth (for training/eval only)
            "avg_monthly_credit_inflow": avg_monthly_credit_inflow,
            "avg_monthly_debit": avg_monthly_debit,
            "credit_inflow_regularity": credit_inflow_regularity.round(3),
            "existing_emi_outflow": existing_emi_outflow,
            "upi_txn_count_per_month": upi_txn_count_per_month,
            "upi_avg_ticket_size": upi_avg_ticket_size,
            "savings_balance_trend": savings_balance_trend.round(4),
            "bounce_count_6m": bounce_count_6m,
            "credit_score": credit_score,
            "existing_customer": existing_customer,
            "loan_page_visits_30d": loan_page_visits_30d,
            "emi_calculator_uses_30d": emi_calculator_uses_30d,
            "days_since_last_inquiry": days_since_last_inquiry,
        }
    )
    return df


FEATURE_COLUMNS_INCOME_MODEL = [
    "avg_monthly_credit_inflow",
    "avg_monthly_debit",
    "credit_inflow_regularity",
    "existing_emi_outflow",
    "upi_txn_count_per_month",
    "upi_avg_ticket_size",
    "savings_balance_trend",
    "bounce_count_6m",
]

FEATURE_COLUMNS_INTENT_MODEL = [
    "existing_customer",
    "loan_page_visits_30d",
    "emi_calculator_uses_30d",
    "days_since_last_inquiry",
    "credit_inflow_regularity",
    "upi_txn_count_per_month",
]
