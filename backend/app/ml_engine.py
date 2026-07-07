"""
Two-layer scoring architecture (same pattern proven in our MSME
Financial Health Card build):

  Layer 1 - Deterministic credit-policy rules (config.py)
            -> hard eligibility gate per loan product.

  Layer 2 - ML models
            (a) Income Estimation Model (RandomForestRegressor)
                Predicts a borrower's *actual* monthly income from
                transaction/behavioural features alone, closing the
                declared-vs-actual income gap called out in the
                problem statement.
            (b) Intent / Propensity Model (LogisticRegression)
                Predicts probability of genuine conversion from
                digital-behaviour + transaction-consistency signals,
                so we don't just find *eligible* customers but
                *genuinely interested* ones.

Final priority score blends repayment-capacity headroom with intent
probability, but only for customers who pass Layer 1 for at least one
product. This is what lets the surfaced lead list clear the >30%
conversion bar in the expected outcome.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import r2_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from . import config
from .data_generator import (
    FEATURE_COLUMNS_INCOME_MODEL,
    FEATURE_COLUMNS_INTENT_MODEL,
    generate_customers,
)


def _simulate_conversion_label(df: pd.DataFrame, rng) -> np.ndarray:
    """
    Synthesizes a 'did the customer convert when approached' label.
    In production this would be the historical CRM outcome; here we
    build it from a logistic combination of genuine-intent signals
    plus a noise term, so the intent model has real signal to learn
    without simply parroting the eligibility rules.
    """
    z = (
        0.9 * (df["existing_customer"])
        + 0.35 * np.log1p(df["loan_page_visits_30d"])
        + 0.55 * np.log1p(df["emi_calculator_uses_30d"])
        - 0.01 * df["days_since_last_inquiry"]
        - 2.2 * df["credit_inflow_regularity"]
        + 0.004 * df["upi_txn_count_per_month"]
        - 1.4
    )
    prob = 1 / (1 + np.exp(-z))
    noise = rng.normal(0, 0.12, size=len(df))
    return (rng.random(len(df)) < np.clip(prob + noise, 0, 1)).astype(int)


class LendingIntelligenceEngine:
    def __init__(self, seed: int = config.RANDOM_SEED):
        self.rng = np.random.default_rng(seed)
        self.customers = generate_customers(seed=seed)
        self.customers["converted_label"] = _simulate_conversion_label(
            self.customers, self.rng
        )

        self.income_model: RandomForestRegressor | None = None
        self.income_metrics: dict = {}

        self.intent_model: LogisticRegression | None = None
        self.intent_scaler: StandardScaler | None = None
        self.intent_metrics: dict = {}

        self._train_income_model()
        self._train_intent_model()
        self._score_all_customers()

    # ---------------------------------------------------------- training
    def _train_income_model(self):
        X = self.customers[FEATURE_COLUMNS_INCOME_MODEL]
        y = self.customers["true_income"]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=config.RANDOM_SEED
        )
        model = RandomForestRegressor(
            n_estimators=300,
            max_depth=10,
            min_samples_leaf=4,
            random_state=config.RANDOM_SEED,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        mape = float(np.mean(np.abs((y_test - preds) / y_test)) * 100)
        self.income_metrics = {
            "r2_score": round(r2_score(y_test, preds), 3),
            "mean_abs_pct_error": round(mape, 2),
            "n_test_samples": int(len(y_test)),
        }
        self.income_model = model

        # Estimated income + confidence band for every customer
        X_values = X.values
        all_preds = model.predict(X_values)
        tree_preds = np.stack([t.predict(X_values) for t in model.estimators_])
        std = tree_preds.std(axis=0)
        self.customers["estimated_income"] = all_preds.round(-2)
        self.customers["estimated_income_std"] = std.round(0)
        self.customers["income_confidence_pct"] = np.clip(
            100 - (std / np.maximum(all_preds, 1)) * 100, 40, 99
        ).round(1)
        self.customers["declared_vs_estimated_gap_pct"] = (
            (self.customers["declared_income"] - self.customers["estimated_income"])
            / self.customers["estimated_income"]
            * 100
        ).round(1)

    def _train_intent_model(self):
        X = self.customers[FEATURE_COLUMNS_INTENT_MODEL]
        y = self.customers["converted_label"]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=config.RANDOM_SEED, stratify=y
        )
        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        model = LogisticRegression(max_iter=1000, class_weight="balanced")
        model.fit(X_train_s, y_train)
        proba = model.predict_proba(X_test_s)[:, 1]

        self.intent_metrics = {
            "roc_auc": round(roc_auc_score(y_test, proba), 3),
            "n_test_samples": int(len(y_test)),
            "base_conversion_rate_pct": round(y.mean() * 100, 1),
        }
        self.intent_model = model
        self.intent_scaler = scaler

        X_all_s = scaler.transform(X)
        self.customers["intent_score"] = model.predict_proba(X_all_s)[:, 1].round(3)

    # ------------------------------------------------------------- rules
    @staticmethod
    def _eligible_for_product(row: pd.Series, product: str) -> tuple[bool, list[dict]]:
        checklist = []

        income_ok = row["estimated_income"] >= config.MIN_ESTIMATED_INCOME[product]
        checklist.append(
            {
                "criterion": "Minimum verified income",
                "required": f">= INR {config.MIN_ESTIMATED_INCOME[product]:,}/mo",
                "actual": f"INR {row['estimated_income']:,.0f}/mo",
                "passed": bool(income_ok),
            }
        )

        proposed_emi_proxy = row["estimated_income"] * 0.10  # conservative proxy add-on
        dti = (row["existing_emi_outflow"] + proposed_emi_proxy) / max(
            row["estimated_income"], 1
        )
        dti_ok = dti <= config.MAX_DTI[product]
        checklist.append(
            {
                "criterion": "Debt-to-Income ratio",
                "required": f"<= {config.MAX_DTI[product] * 100:.0f}%",
                "actual": f"{dti * 100:.1f}%",
                "passed": bool(dti_ok),
            }
        )

        score_ok = row["credit_score"] >= config.MIN_CREDIT_SCORE[product]
        checklist.append(
            {
                "criterion": "Bureau credit score",
                "required": f">= {config.MIN_CREDIT_SCORE[product]}",
                "actual": f"{row['credit_score']:.0f}",
                "passed": bool(score_ok),
            }
        )

        bounce_ok = row["bounce_count_6m"] <= config.MAX_BOUNCES_6M[product]
        checklist.append(
            {
                "criterion": "Payment bounces (6 months)",
                "required": f"<= {config.MAX_BOUNCES_6M[product]}",
                "actual": f"{row['bounce_count_6m']:.0f}",
                "passed": bool(bounce_ok),
            }
        )

        age_ok = (
            row["age"] >= config.MIN_AGE
            and row["age"] <= config.MAX_AGE_AT_MATURITY[product]
        )
        checklist.append(
            {
                "criterion": "Age band",
                "required": f"{config.MIN_AGE}-{config.MAX_AGE_AT_MATURITY[product]} yrs",
                "actual": f"{row['age']:.0f} yrs",
                "passed": bool(age_ok),
            }
        )

        all_passed = all(item["passed"] for item in checklist)
        return all_passed, checklist

    # Priority order: highest-value / strictest product first.
    # Mortgage (income ≥60k, bureau ≥720, DTI ≤40%) → Home (40k, 700, 45%) →
    # Personal (25k, 650, 50%, age≤60) → Auto (20k, 620, 55%, age≤65).
    # Personal Loan is ranked above Auto Loan because Personal Loan has
    # stricter income and bureau thresholds — it is the more premium
    # unsecured product. This ordering ensures customers who qualify for
    # Personal Loan are NOT always overridden by the easier Auto Loan.
    _PRODUCT_PRIORITY = ["mortgage_loan", "home_loan", "personal_loan", "auto_loan"]

    def _score_all_customers(self):
        eligibility_map = {}
        recommended_product = []
        eligible_any = []
        repayment_capacity_score = []
        # Per-product eligibility booleans (one column per product).
        # Used by get_leads() so that filtering by e.g. personal_loan returns
        # ALL customers who qualify for it, not just those whose *top*
        # recommended product happens to be personal_loan.
        product_eligible_flags: dict[str, list[bool]] = {
            p: [] for p in config.LOAN_TYPES
        }

        for _, row in self.customers.iterrows():
            per_product = {}
            passed_products = []
            for product in config.LOAN_TYPES:
                passed, checklist = self._eligible_for_product(row, product)
                per_product[product] = checklist
                product_eligible_flags[product].append(passed)
                if passed:
                    passed_products.append(product)
            eligibility_map[row["customer_id"]] = per_product

            best = next(
                (p for p in self._PRODUCT_PRIORITY if p in passed_products), None
            )
            recommended_product.append(best)
            eligible_any.append(best is not None)

            # Headroom-based repayment capacity score (0-1)
            headroom = 1 - (
                (row["existing_emi_outflow"] + row["estimated_income"] * 0.10)
                / max(row["estimated_income"], 1)
            )
            repayment_capacity_score.append(float(np.clip(headroom, 0, 1)))

        self.customers["eligible_any_product"] = eligible_any
        self.customers["recommended_product"] = recommended_product
        self.customers["repayment_capacity_score"] = np.round(
            repayment_capacity_score, 3
        )
        # Store per-product boolean columns so loan_type filter works correctly.
        for product, flags in product_eligible_flags.items():
            self.customers[f"eligible_{product}"] = flags

        self._eligibility_checklists = eligibility_map

        self.customers["priority_score"] = np.where(
            self.customers["eligible_any_product"],
            (
                0.5 * self.customers["repayment_capacity_score"]
                + 0.5 * self.customers["intent_score"]
            ).round(3),
            0.0,
        )
        self.customers["is_surfaced_lead"] = (
            self.customers["priority_score"] >= config.LEAD_SURFACE_THRESHOLD
        )

    # ------------------------------------------------------------ access
    def get_leads(
        self,
        loan_type: str | None = None,
        min_score: float = 0.0,
        surfaced_only: bool = True,
        limit: int = 200,
    ) -> list[dict]:
        df = self.customers.copy()
        if surfaced_only:
            df = df[df["is_surfaced_lead"]]
        if loan_type:
            # Filter by per-product eligibility, NOT by recommended_product.
            # This ensures every product filter returns a meaningful result set.
            eligible_col = f"eligible_{loan_type}"
            df = df[df[eligible_col]]
            # When an RM filters by a specific product, override the displayed
            # recommended_product to the filtered product for rows where the
            # customer qualifies for it — otherwise the table shows confusing
            # "Auto Loan" recommendations when the RM asked for "Personal Loan".
            # The override only applies to the list view; the detail drawer still
            # shows the true top recommendation.
            df = df.copy()
            df["recommended_product"] = loan_type
        df = df[df["priority_score"] >= min_score]
        df = df.sort_values("priority_score", ascending=False).head(limit)

        cols = [
            "customer_id",
            "occupation_type",
            "age",
            "declared_income",
            "estimated_income",
            "income_confidence_pct",
            "declared_vs_estimated_gap_pct",
            "credit_score",
            "recommended_product",
            "repayment_capacity_score",
            "intent_score",
            "priority_score",
            "is_surfaced_lead",
        ]
        return df[cols].to_dict(orient="records")

    def get_customer_detail(self, customer_id: str) -> dict | None:
        row = self.customers[self.customers["customer_id"] == customer_id]
        if row.empty:
            return None
        row = row.iloc[0]
        return {
            "customer_id": row["customer_id"],
            "occupation_type": row["occupation_type"],
            "age": int(row["age"]),
            "declared_income": float(row["declared_income"]),
            "estimated_income": float(row["estimated_income"]),
            "income_confidence_pct": float(row["income_confidence_pct"]),
            "declared_vs_estimated_gap_pct": float(row["declared_vs_estimated_gap_pct"]),
            "credit_score": float(row["credit_score"]),
            "existing_emi_outflow": float(row["existing_emi_outflow"]),
            "bounce_count_6m": int(row["bounce_count_6m"]),
            "intent_score": float(row["intent_score"]),
            "repayment_capacity_score": float(row["repayment_capacity_score"]),
            "priority_score": float(row["priority_score"]),
            "recommended_product": row["recommended_product"],
            "is_surfaced_lead": bool(row["is_surfaced_lead"]),
            "eligibility": self._eligibility_checklists[customer_id],
            "behavioural_signals": {
                "avg_monthly_credit_inflow": float(row["avg_monthly_credit_inflow"]),
                "credit_inflow_regularity": float(row["credit_inflow_regularity"]),
                "upi_txn_count_per_month": int(row["upi_txn_count_per_month"]),
                "loan_page_visits_30d": int(row["loan_page_visits_30d"]),
                "emi_calculator_uses_30d": int(row["emi_calculator_uses_30d"]),
                "days_since_last_inquiry": int(row["days_since_last_inquiry"]),
                "existing_customer": bool(row["existing_customer"]),
            },
        }

    def get_analytics_summary(self) -> dict:
        df = self.customers
        surfaced = df[df["is_surfaced_lead"]]
        # Precision proxy: of surfaced leads, how many carry the simulated
        # 'converted_label' -> stands in for backtested conversion rate.
        achieved_conversion_rate = (
            round(surfaced["converted_label"].mean() * 100, 1)
            if len(surfaced) > 0
            else 0.0
        )
        by_product = (
            surfaced.groupby("recommended_product")["customer_id"]
            .count()
            .to_dict()
        )
        return {
            "total_customers_evaluated": int(len(df)),
            "eligible_customers": int(df["eligible_any_product"].sum()),
            "surfaced_leads": int(len(surfaced)),
            "achieved_conversion_rate_pct": achieved_conversion_rate,
            "conversion_target_pct": 30.0,
            "target_met": bool(achieved_conversion_rate >= 30.0),
            "leads_by_product": by_product,
            "income_model_metrics": self.income_model and self.income_metrics,
            "intent_model_metrics": self.intent_model and self.intent_metrics,
            "avg_declared_vs_estimated_gap_pct": round(
                df["declared_vs_estimated_gap_pct"].mean(), 1
            ),
        }


# Singleton, trained once at process startup (see main.py lifespan)
engine: LendingIntelligenceEngine | None = None


def get_engine() -> LendingIntelligenceEngine:
    global engine
    if engine is None:
        engine = LendingIntelligenceEngine()
    return engine
