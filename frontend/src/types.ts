export type LoanType = "personal_loan" | "auto_loan" | "home_loan" | "mortgage_loan";

export interface LeadSummary {
  customer_id: string;
  occupation_type: string;
  age: number;
  declared_income: number;
  estimated_income: number;
  income_confidence_pct: number;
  declared_vs_estimated_gap_pct: number;
  credit_score: number;
  recommended_product: LoanType | null;
  repayment_capacity_score: number;
  intent_score: number;
  priority_score: number;
  is_surfaced_lead: boolean;
}

export interface EligibilityCriterion {
  criterion: string;
  required: string;
  actual: string;
  passed: boolean;
}

export interface BehaviouralSignals {
  avg_monthly_credit_inflow: number;
  credit_inflow_regularity: number;
  upi_txn_count_per_month: number;
  loan_page_visits_30d: number;
  emi_calculator_uses_30d: number;
  days_since_last_inquiry: number;
  existing_customer: boolean;
}

export interface CustomerDetail extends LeadSummary {
  existing_emi_outflow: number;
  bounce_count_6m: number;
  eligibility: Record<LoanType, EligibilityCriterion[]>;
  behavioural_signals: BehaviouralSignals;
}

export interface AnalyticsSummary {
  total_customers_evaluated: number;
  eligible_customers: number;
  surfaced_leads: number;
  achieved_conversion_rate_pct: number;
  conversion_target_pct: number;
  target_met: boolean;
  leads_by_product: Record<string, number>;
  income_model_metrics: {
    r2_score: number;
    mean_abs_pct_error: number;
    n_test_samples: number;
  } | null;
  intent_model_metrics: {
    roc_auc: number;
    n_test_samples: number;
    base_conversion_rate_pct: number;
  } | null;
  avg_declared_vs_estimated_gap_pct: number;
}
