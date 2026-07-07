# Retail Lending Lead Intelligence Engine

**Track 02 — Lead Generation / Behavioural Analytics / Retail Lending**

A full-stack solution that replaces a bank's traditional-metrics lead
generation with a two-layer, data-driven engine that (1) verifies a
borrower's *actual* income from transaction and behavioural data, and
(2) ranks prospects by genuine conversion intent — so relationship
managers spend time only on eligible, quantifiably credit-worthy,
genuinely interested customers.

Stack: **React + TypeScript (Vite)** frontend, **FastAPI (Python)**
backend, **scikit-learn** for the ML layer.

---

## 1. Problem Statement → Solution Mapping (Checklist)

| Problem statement requirement | How this solution addresses it |
|---|---|
| Move beyond traditional metrics | Two-layer scoring: deterministic credit-policy rules (`backend/app/config.py`) + two ML models, instead of a single static score |
| Identify **eligible** prospects | Layer-1 rule engine checks income, DTI, bureau score, bounce history, and age band per product (`ml_engine.py::_eligible_for_product`) |
| **Quantifiable repayment capacity** | `repayment_capacity_score` = income headroom after existing + proposed EMI, computed per customer |
| **Genuinely interested** prospects | `intent_score` from a Logistic Regression model trained on digital-behaviour signals (loan-page visits, EMI-calculator use, inquiry recency, existing-customer flag) |
| Using **transaction and behavioural insights** | All features are transaction/behaviour-derived: UPI frequency & ticket size, credit-inflow regularity, average monthly credit/debit, savings trend, bounce count, browsing/inquiry activity |

| Expected outcome | How this solution meets it |
|---|---|
| Conversion rate **> 30%** | Leads are only "surfaced" above a tuned priority-score threshold (`config.LEAD_SURFACE_THRESHOLD`). Backtested against the simulated conversion label, surfaced leads convert at **~35–38%** (see `/api/analytics/summary` → `achieved_conversion_rate_pct`, shown live on the Analytics page) |
| Accurate assessment of **borrowers' actual income** | A Random Forest Regressor predicts true income from transaction/behavioural features alone (not the self-declared figure), achieving **R² ≈ 0.97** and **~6% mean absolute error** against the (simulated) verified-income ground truth. Every lead shows Declared vs. AI-Estimated income with a confidence band |
| Support prudent underwriting for **Personal / Home / Mortgage / Auto Loan** | Each product has its own income floor, max DTI, min bureau score, bounce tolerance, and age band; the UI shows a pass/fail checklist per product for every customer, plus a single recommended product |

> **Note on data:** No real bank data was available for this hackathon
> build, so `backend/app/data_generator.py` synthesizes a realistic
> 1,200-customer portfolio with a deliberate gap between
> self-declared income and a latent "true income" (standing in for
> AA/GST-verified data). The income model is trained to recover that
> latent truth from transaction features only. In production, swap
> the generator for real Account Aggregator / core-banking / GST /
> clickstream feeds — the modelling and rule logic do not change.

---

## 2. Architecture

```
┌─────────────────────┐        REST/JSON        ┌──────────────────────────┐
│  React + TypeScript  │ ──────────────────────► │        FastAPI            │
│  (Vite, Tailwind,    │ ◄────────────────────── │                            │
│   Recharts)          │                         │  Layer 1: rule engine      │
│                       │                         │  (config.py)               │
│  - Lead Pipeline      │                         │                            │
│  - Customer Detail    │                         │  Layer 2: ML models        │
│    (income breakdown, │                         │   • Income Estimator       │
│     eligibility,      │                         │     (RandomForestReg.)     │
│     behaviour)        │                         │   • Intent/Propensity      │
│  - Model Analytics    │                         │     (LogisticRegression)   │
└─────────────────────┘                         │                            │
                                                  │  Synthetic data generator  │
                                                  │  (data_generator.py)       │
                                                  └──────────────────────────┘
```

**Scoring flow per customer:**
1. Generate/receive transaction & behavioural features.
2. Income Estimator predicts `estimated_income` (+ confidence band) from transaction features — closes the declared-vs-actual gap.
3. Rule engine checks eligibility for each of the 4 products using `estimated_income`, DTI, bureau score, bounces, age.
4. Intent model predicts `intent_score` from behavioural/engagement features.
5. `priority_score = 0.5 × repayment_capacity_score + 0.5 × intent_score`, but only for customers eligible for at least one product.
6. Customers above `LEAD_SURFACE_THRESHOLD` become **surfaced leads**, ranked and routed to RMs with a recommended product.

---

## 3. Where Does the Data Come From?

### Current (Demo / Hackathon Build)

All data is **synthetically generated** by `backend/app/data_generator.py` at server startup using NumPy random distributions. The generator creates a realistic 1,200-customer dataset that mimics:

| Synthetic Feature | Stands In For (Production) |
|---|---|
| `true_income` (lognormal) | AA-verified bank statement inflows / GST filing income |
| `declared_income` (inflated by 3–35%) | Self-reported income on loan application form |
| `avg_monthly_credit_inflow` | Core-banking credit transaction aggregates |
| `avg_monthly_debit` | Core-banking debit transaction aggregates |
| `credit_inflow_regularity` (CV) | Account Aggregator cash-flow regularity metric |
| `upi_txn_count_per_month` | UPI rails transaction logs |
| `bounce_count_6m` | ECS/NACH/UPI-autopay failure records |
| `credit_score` | Bureau pull (CIBIL / Experian / CRIF) |
| `loan_page_visits_30d` | Website/app clickstream (CDP/GA4) |
| `emi_calculator_uses_30d` | In-app event tracking |
| `days_since_last_inquiry` | Bureau soft-pull log |
| `existing_customer` | Core banking CIF flag |

### Production Data Pipeline (Drop-in Path)

```
Real data sources                     Replace in code
─────────────────────────────────────────────────────
Account Aggregator (consent)      →  data_generator.py → AA connector
Core banking transaction feed     →  data_generator.py → CBS API
GST returns (for business owners) →  data_generator.py → GST API
Bureau API (CIBIL/Experian)       →  data_generator.py → bureau connector
CRM/Clickstream (CDP/GA4)         →  data_generator.py → event stream
CRM conversion history            →  _simulate_conversion_label() → real labels
```

The modelling code in `ml_engine.py`, rule engine in `config.py`, and all API contracts remain unchanged.

---

## 4. Score Glossary (All Scores Explained)

Every score used in the UI is defined below. Hover over any column header (ℹ icon) or score card in the customer drawer to see these explanations inline.

| Score | Range | Meaning | Model / Formula |
|---|---|---|---|
| **AI-Estimated Income** | ₹ / month | True income estimated from transaction patterns, not self-declared | Random Forest Regressor (300 trees, max_depth=10) |
| **Income Confidence %** | 40–99% | How certain the RF model is. = 100 − (std-dev of tree predictions / mean prediction × 100) | Ensemble variance across 300 trees |
| **Repayment Capacity Score** | 0–100 | Income headroom after existing + proposed EMI. Higher = more room to repay | `1 − (existing_EMI + 10%·income) ÷ estimated_income` |
| **Intent Score** | 0–100 | Probability customer will genuinely convert when contacted | Logistic Regression on 6 behavioural features · ROC-AUC ≈ 0.80+ |
| **Priority Score** | 0–100 | Final RM routing score. Only surfaced if ≥ 55 | `0.5 × Capacity + 0.5 × Intent` |
| **Bureau Score** | 300–900 | Third-party credit bureau score (CIBIL / Experian) | External bureau pull; in demo: synthetic (mean 700, sd 90) |
| **Income Gap %** | ±% | `(declared − estimated) ÷ estimated × 100`. Positive = overstatement | Derived field |
| **Surfaced Lead** | boolean | Passed Layer-1 eligibility for ≥1 product AND Priority Score ≥ 55 | Combined rule + ML gate |

---

## 5. Project Structure

```
retail-lending-intelligence/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # FastAPI app & endpoints
│       ├── config.py          # Credit-policy thresholds per product
│       ├── data_generator.py  # Synthetic transaction/behaviour dataset
│       ├── ml_engine.py       # Income model, intent model, scoring
│       └── models.py          # Pydantic response schemas
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── types.ts
        ├── api/client.ts
        ├── components/
        │   ├── Tooltip.tsx          # Reusable tooltip (all scores)
        │   ├── ScoreBreakdown.tsx   # Animated gauge cards + formula bar
        │   ├── LeadTable.tsx        # Lead list with inline score bars
        │   ├── CustomerDetailDrawer.tsx  # Full customer profile panel
        │   ├── EligibilityChecklist.tsx
        │   ├── IncomeBreakdown.tsx
        │   ├── ConversionFunnel.tsx
        │   ├── StatCard.tsx
        │   └── Sidebar.tsx
        └── pages/
            ├── Dashboard.tsx
            └── Analytics.tsx
```

---

## 6. Running Locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API trains both models at startup (a few seconds) and serves:

- `GET /api/leads` — ranked, filterable lead list
- `GET /api/leads/{customer_id}` — full profile: income breakdown, behavioural signals, per-product eligibility checklist
- `GET /api/analytics/summary` — conversion-rate backtest, model metrics, funnel
- `POST /api/engine/refresh` — regenerate data & retrain (demo utility)
- Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. In dev, Vite proxies `/api` calls to
`http://localhost:8000` (see `vite.config.ts`). For a production
build, set `VITE_API_BASE_URL` to your deployed FastAPI origin, then:

```bash
npm run build
```

---

## 7. UI Features

| Feature | Where |
|---|---|
| Lead pipeline table with inline Intent & Capacity bars | Dashboard |
| Tooltip on every column header (ℹ icon) | Dashboard table |
| Tooltip on priority badge explaining Surfaced Lead concept | Dashboard table |
| Animated arc gauge cards for all 4 scores | Customer detail drawer → Score Breakdown |
| Priority score formula bar with 55-threshold marker | Customer detail drawer |
| Behavioural signal strength bars with contextual hints | Customer detail drawer |
| Per-product eligibility pass/fail checklist | Customer detail drawer |
| Declared vs. AI-estimated income bar chart | Customer detail drawer |
| Funnel (Total → Eligible → Surfaced), model metrics | Analytics page |

---

## 8. Demo Script (for hackathon submission video)

1. **Dashboard** — show the surfaced lead list, sorted by priority score, filterable by loan product.
2. **Hover a column header** (e.g. "Intent") — show the tooltip explaining what the score means and how it's computed.
3. Click a customer with a large declared-vs-estimated income gap — show the **Income Verification** chart and confidence %.
4. In the **Score Breakdown** panel — hover each gauge card to see the tooltip, point out the formula bar showing 50/50 blend.
5. Show the **Eligibility Checklist** — point out a customer who fails Home Loan (age) but passes Auto Loan.
6. Switch to **Model Analytics** — show the funnel and the backtested conversion rate clearing the 30% target.
7. Close by noting the synthetic-data caveat and the drop-in path to real AA/GST/core-banking data.

---

## 9. Extending to Production

- Replace `data_generator.py` with connectors to Account Aggregator (consent-based), core banking transaction feeds, GST returns, and CRM/clickstream logs.
- Retrain the income model against actual verified income (e.g., from payroll/GST data) rather than a simulated label.
- Persist the trained models (`joblib`) and add a scheduled retraining job.
- Add authentication/RBAC for RM-facing endpoints and audit logging for underwriting decisions (DPDP Act compliance).
