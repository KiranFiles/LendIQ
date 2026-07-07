"""
Central configuration & business rule constants for the
Retail Lending Lead Intelligence Engine.

All thresholds below are the deterministic "Layer 1" eligibility
rules referenced in ml_engine.py. Keeping them here means a bank's
credit policy team can tune the product without touching model code.
"""

RANDOM_SEED = 42
N_CUSTOMERS = 1200

# Minimum acceptable bureau score per product
MIN_CREDIT_SCORE = {
    "personal_loan": 650,
    "auto_loan": 620,
    "home_loan": 700,
    "mortgage_loan": 720,
}

# Maximum Debt-to-Income (existing EMI + proposed EMI proxy / estimated income)
MAX_DTI = {
    "personal_loan": 0.50,
    "auto_loan": 0.55,
    "home_loan": 0.45,
    "mortgage_loan": 0.40,
}

# Minimum estimated monthly income (INR) required to be considered eligible
MIN_ESTIMATED_INCOME = {
    "personal_loan": 25_000,
    "auto_loan": 20_000,
    "home_loan": 40_000,
    "mortgage_loan": 60_000,
}

# Max cheque/ECS/UPI-autopay bounces allowed in trailing 6 months
MAX_BOUNCES_6M = {
    "personal_loan": 1,
    "auto_loan": 1,
    "home_loan": 0,
    "mortgage_loan": 0,
}

# Age band
MIN_AGE = 21
MAX_AGE_AT_MATURITY = {
    "personal_loan": 60,
    "auto_loan": 65,
    "home_loan": 65,
    "mortgage_loan": 65,
}

# Lead is only surfaced to an RM if final priority score clears this bar.
# Tuned against the synthetic "converted" label so that precision among
# surfaced leads exceeds the 30% conversion target in the brief.
LEAD_SURFACE_THRESHOLD = 0.55

LOAN_TYPES = ["personal_loan", "auto_loan", "home_loan", "mortgage_loan"]
