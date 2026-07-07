import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import CustomerDetailDrawer from "../components/CustomerDetailDrawer";
import LeadTable from "../components/LeadTable";
import StatCard from "../components/StatCard";
import type { AnalyticsSummary, CustomerDetail, LeadSummary, LoanType } from "../types";

const PRODUCT_OPTIONS: { value: LoanType | "all"; label: string }[] = [
  { value: "all", label: "All Products" },
  { value: "mortgage_loan", label: "Mortgage Loan" },
  { value: "home_loan", label: "Home Loan" },
  { value: "auto_loan", label: "Auto Loan" },
  { value: "personal_loan", label: "Personal Loan" },
];

export default function Dashboard() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [productFilter, setProductFilter] = useState<LoanType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getLeads({
        loanType: productFilter === "all" ? undefined : productFilter,
        limit: 500,
      }),
      api.getAnalyticsSummary(),
    ])
      .then(([leadsRes, summaryRes]) => {
        setLeads(leadsRes);
        setSummary(summaryRes);
      })
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [productFilter]);

  const handleSelect = (customerId: string) => {
    setSelectedId(customerId);
    setDetailLoading(true);
    api
      .getLeadDetail(customerId)
      .then(setDetail)
      .finally(() => setDetailLoading(false));
  };

  const avgIntent = useMemo(() => {
    if (leads.length === 0) return 0;
    return (leads.reduce((sum, l) => sum + l.intent_score, 0) / leads.length) * 100;
  }, [leads]);

  const PRODUCT_LABEL: Record<string, string> = {
    mortgage_loan: "Mortgage Loan",
    home_loan: "Home Loan",
    auto_loan: "Auto Loan",
    personal_loan: "Personal Loan",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Retail Lending Lead Pipeline</h1>
          <p className="text-sm text-ink-500 mt-1">
            Eligible, income-verified, genuinely interested prospects ranked for RM outreach.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
            Filter by product
          </label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value as LoanType | "all")}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
          >
            {PRODUCT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Context banner when a product filter is active */}
      {productFilter !== "all" && !loading && (
        <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-lg mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {leads.length} lead{leads.length !== 1 ? "s" : ""} eligible for{" "}
              {PRODUCT_LABEL[productFilter]}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {productFilter === "auto_loan" ? (
                <>
                  Auto Loan has the <strong>broadest eligibility</strong> (lowest income floor ₹20k, lowest bureau
                  score 620, highest DTI 55%) — almost all surfaced leads qualify. The{" "}
                  <strong>Product</strong> column shows each customer&apos;s top recommendation.
                </>
              ) : (
                <>
                  Shows all surfaced leads who <strong>qualify</strong> for {PRODUCT_LABEL[productFilter]},
                  even if a higher-value product is also recommended. The{" "}
                  <strong>Product</strong> column shows each customer&apos;s top recommendation.
                </>
              )}
            </p>
          </div>
        </div>
      )}


      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          Could not reach the API: {error}. Make sure the FastAPI backend is running on
          http://localhost:8000.
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Surfaced Leads" value={summary.surfaced_leads.toLocaleString("en-IN")} />
          <StatCard
            label="Backtested Conversion"
            value={`${summary.achieved_conversion_rate_pct}%`}
            sublabel={`Target: >${summary.conversion_target_pct}%`}
            accent={summary.target_met ? "positive" : "warning"}
          />
          <StatCard
            label="Income Model Accuracy"
            value={`${((summary.income_model_metrics?.r2_score ?? 0) * 100).toFixed(1)}% R²`}
            sublabel={`MAPE ${summary.income_model_metrics?.mean_abs_pct_error ?? "-"}%`}
          />
          <StatCard label="Avg. Intent Score (filtered)" value={`${avgIntent.toFixed(0)}%`} />
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-ink-500">
          Loading leads…
        </div>
      ) : (
        <LeadTable leads={leads} onSelect={handleSelect} selectedId={selectedId} />
      )}

      <CustomerDetailDrawer
        customer={detail}
        loading={detailLoading}
        onClose={() => {
          setSelectedId(undefined);
          setDetail(null);
        }}
      />
    </div>
  );
}

