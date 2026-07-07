import type { CustomerDetail, LoanType } from "../types";
import EligibilityChecklist from "./EligibilityChecklist";
import IncomeBreakdown from "./IncomeBreakdown";
import ScoreBreakdown from "./ScoreBreakdown";

interface Props {
  customer: CustomerDetail | null;
  loading: boolean;
  onClose: () => void;
}

const PRODUCT_LABEL: Record<LoanType, string> = {
  personal_loan: "Personal Loan",
  auto_loan: "Auto Loan",
  home_loan: "Home Loan",
  mortgage_loan: "Mortgage Loan",
};

const PRODUCT_ICON: Record<LoanType, string> = {
  personal_loan: "👤",
  auto_loan: "🚗",
  home_loan: "🏠",
  mortgage_loan: "🏢",
};

const SIGNAL_ICON: Record<string, string> = {
  avg_monthly_credit_inflow: "💰",
  credit_inflow_regularity: "📊",
  upi_txn_count_per_month: "📱",
  loan_page_visits_30d: "🔍",
  emi_calculator_uses_30d: "🧮",
  days_since_last_inquiry: "📅",
  existing_customer: "⭐",
};

const SIGNAL_LABEL: Record<string, string> = {
  avg_monthly_credit_inflow: "Avg. Monthly Credit Inflow",
  credit_inflow_regularity: "Credit Inflow Regularity (CV)",
  upi_txn_count_per_month: "UPI Transactions / Month",
  loan_page_visits_30d: "Loan Page Visits (30d)",
  emi_calculator_uses_30d: "EMI Calculator Uses (30d)",
  days_since_last_inquiry: "Days Since Last Inquiry",
  existing_customer: "Existing Bank Customer",
};

const SIGNAL_HINT: Record<string, string> = {
  avg_monthly_credit_inflow: "Higher = stronger income base",
  credit_inflow_regularity: "Lower = more stable income",
  upi_txn_count_per_month: "Higher = financially active",
  loan_page_visits_30d: "More visits = researching loans",
  emi_calculator_uses_30d: "Uses calculator = serious intent",
  days_since_last_inquiry: "Fewer days = recent loan interest",
  existing_customer: "Existing customers convert 2× more",
};

function signalStrength(key: string, val: number | boolean): "high" | "mid" | "low" {
  if (key === "existing_customer") return val ? "high" : "mid";
  if (key === "loan_page_visits_30d") return (val as number) >= 4 ? "high" : (val as number) >= 1 ? "mid" : "low";
  if (key === "emi_calculator_uses_30d") return (val as number) >= 3 ? "high" : (val as number) >= 1 ? "mid" : "low";
  if (key === "days_since_last_inquiry") return (val as number) <= 30 ? "high" : (val as number) <= 90 ? "mid" : "low";
  if (key === "upi_txn_count_per_month") return (val as number) >= 50 ? "high" : (val as number) >= 20 ? "mid" : "low";
  if (key === "credit_inflow_regularity") return (val as number) <= 0.3 ? "high" : (val as number) <= 0.6 ? "mid" : "low";
  if (key === "avg_monthly_credit_inflow") return (val as number) >= 50000 ? "high" : (val as number) >= 25000 ? "mid" : "low";
  return "mid";
}

const strengthStyle = {
  high: { bar: "bg-emerald-500", text: "text-emerald-600", label: "Strong" },
  mid: { bar: "bg-amber-400", text: "text-amber-600", label: "Moderate" },
  low: { bar: "bg-gray-300", text: "text-gray-400", label: "Weak" },
};
const strengthWidth = { high: "w-full", mid: "w-1/2", low: "w-1/4" };

export default function CustomerDetailDrawer({ customer, loading, onClose }: Props) {
  if (!customer && !loading) return null;

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !customer ? (
          <div className="p-6 text-sm text-gray-500 animate-pulse">Loading customer profile…</div>
        ) : (
          <>
            {/* ── Header banner ── */}
            <div
              className={`px-5 py-4 ${
                customer.is_surfaced_lead
                  ? "bg-gradient-to-r from-red-600 to-orange-500"
                  : "bg-gradient-to-r from-gray-700 to-gray-500"
              } text-white`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-0.5">
                    Customer Profile
                  </p>
                  <p className="text-lg font-bold">{customer.customer_id}</p>
                  <p className="text-sm opacity-90 capitalize mt-0.5">
                    {customer.occupation_type.replace(/_/g, " ")} · Age {customer.age}
                  </p>
                </div>
                <div className="text-right">
                  {customer.is_surfaced_lead ? (
                    <span className="inline-block bg-white/20 border border-white/40 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      ✅ Surfaced Lead
                    </span>
                  ) : (
                    <span className="inline-block bg-white/20 text-white/80 text-xs px-3 py-1 rounded-full">
                      Below Threshold
                    </span>
                  )}
                  {customer.recommended_product && (
                    <p className="text-xs opacity-80 mt-1.5">
                      {PRODUCT_ICON[customer.recommended_product]}{" "}
                      {PRODUCT_LABEL[customer.recommended_product]}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Bureau Score", value: customer.credit_score.toFixed(0) },
                  {
                    label: "AI-Est. Income",
                    value: `₹${(customer.estimated_income / 1000).toFixed(0)}k`,
                  },
                  {
                    label: "Existing EMI",
                    value: `₹${(customer.existing_emi_outflow / 1000).toFixed(0)}k`,
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-white/15 rounded-lg px-3 py-2 text-center">
                    <p className="text-[10px] opacity-75 leading-tight">{s.label}</p>
                    <p className="text-base font-bold mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Body ── */}
            <div className="p-5 space-y-6">

              {/* Score breakdown — the main interactive section */}
              <ScoreBreakdown customer={customer} />

              {/* Income verification */}
              <div>
                <IncomeBreakdown customer={customer} />
              </div>

              {/* Behavioural signals */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Behavioural Signals
                  <span className="ml-2 text-[10px] font-normal text-gray-400">
                    (feed the intent model)
                  </span>
                </p>
                <div className="space-y-2">
                  {Object.entries(customer.behavioural_signals).map(([key, raw]) => {
                    const val = raw as number | boolean;
                    const strength = signalStrength(key, val);
                    const style = strengthStyle[strength];
                    const display =
                      typeof val === "boolean"
                        ? val ? "Yes" : "No"
                        : key === "avg_monthly_credit_inflow"
                        ? `₹${(val as number).toLocaleString("en-IN")}`
                        : String(val);

                    return (
                      <div key={key} className="flex items-center gap-3 group">
                        <span className="text-base w-6 shrink-0">{SIGNAL_ICON[key]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {SIGNAL_LABEL[key]}
                            </p>
                            <span className={`text-xs font-semibold ml-2 shrink-0 ${style.text}`}>
                              {display}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${style.bar} ${strengthWidth[strength]} transition-all duration-700`}
                            />
                          </div>
                        </div>
                        {/* hint tooltip */}
                        <div className="relative">
                          <span className="text-[10px] text-gray-300 cursor-default">ℹ</span>
                          <div className="absolute bottom-full right-0 mb-1 w-40 bg-gray-900 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl leading-snug">
                            {SIGNAL_HINT[key]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Eligibility checklist */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Eligibility Checklist by Product
                </p>
                <EligibilityChecklist
                  eligibility={customer.eligibility}
                  recommendedProduct={customer.recommended_product}
                />
              </div>
            </div>

            {/* Footer close */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3">
              <button
                onClick={onClose}
                className="w-full text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                Close Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
