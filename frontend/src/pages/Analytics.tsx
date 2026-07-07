import { useEffect, useState } from "react";
import { api } from "../api/client";
import ConversionFunnel from "../components/ConversionFunnel";
import StatCard from "../components/StatCard";
import type { AnalyticsSummary } from "../types";

const PRODUCT_LABEL: Record<string, string> = {
  personal_loan: "Personal Loan",
  auto_loan: "Auto Loan",
  home_loan: "Home Loan",
  mortgage_loan: "Mortgage Loan",
};

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    api.getAnalyticsSummary().then(setSummary);
  }, []);

  if (!summary) {
    return <div className="p-6 text-sm text-ink-500">Loading model analytics…</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Model & Outcome Analytics</h1>
        <p className="text-sm text-ink-500 mt-1">
          Evidence that the solution meets the expected outcome in the problem statement.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Conversion Rate (backtested)"
          value={`${summary.achieved_conversion_rate_pct}%`}
          sublabel={summary.target_met ? "Clears the 30% target" : "Below target"}
          accent={summary.target_met ? "positive" : "warning"}
        />
        <StatCard
          label="Income Model R²"
          value={`${summary.income_model_metrics?.r2_score ?? "-"}`}
          sublabel={`Mean abs. % error: ${summary.income_model_metrics?.mean_abs_pct_error ?? "-"}%`}
        />
        <StatCard
          label="Intent Model ROC-AUC"
          value={`${summary.intent_model_metrics?.roc_auc ?? "-"}`}
          sublabel={`Base rate ${summary.intent_model_metrics?.base_conversion_rate_pct ?? "-"}%`}
        />
        <StatCard
          label="Eligible Customers"
          value={summary.eligible_customers.toLocaleString("en-IN")}
          sublabel={`of ${summary.total_customers_evaluated.toLocaleString("en-IN")} evaluated`}
        />
        <StatCard
          label="Avg. Income Gap (declared vs. verified)"
          value={`${summary.avg_declared_vs_estimated_gap_pct}%`}
        />
        <StatCard
          label="Surfaced Leads"
          value={summary.surfaced_leads.toLocaleString("en-IN")}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ConversionFunnel summary={summary} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-ink-900 mb-3">Surfaced Leads by Product</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary.leads_by_product).map(([product, count]) => (
            <div key={product} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-ink-500">{PRODUCT_LABEL[product] ?? product}</p>
              <p className="text-lg font-semibold text-ink-900">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
