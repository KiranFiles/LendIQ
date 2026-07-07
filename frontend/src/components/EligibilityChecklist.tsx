import type { EligibilityCriterion, LoanType } from "../types";

const PRODUCT_LABEL: Record<LoanType, string> = {
  personal_loan: "Personal Loan",
  auto_loan: "Auto Loan",
  home_loan: "Home Loan",
  mortgage_loan: "Mortgage Loan",
};

interface Props {
  eligibility: Record<LoanType, EligibilityCriterion[]>;
  recommendedProduct: LoanType | null;
}

export default function EligibilityChecklist({ eligibility, recommendedProduct }: Props) {
  const order: LoanType[] = ["mortgage_loan", "home_loan", "auto_loan", "personal_loan"];

  return (
    <div className="space-y-4">
      {order.map((product) => {
        const criteria = eligibility[product];
        if (!criteria) return null;
        const passed = criteria.every((c) => c.passed);
        return (
          <div
            key={product}
            className={`rounded-lg border p-3 ${
              passed ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink-900">
                {PRODUCT_LABEL[product]}
                {product === recommendedProduct && (
                  <span className="ml-2 text-xs font-medium text-brand-600">Recommended</span>
                )}
              </p>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  passed
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {passed ? "Eligible" : "Not eligible"}
              </span>
            </div>
            <ul className="space-y-1.5">
              {criteria.map((c) => (
                <li key={c.criterion} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      c.passed
                        ? "bg-emerald-500 text-white"
                        : "bg-red-400 text-white"
                    }`}
                  >
                    {c.passed ? "✓" : "✕"}
                  </span>
                  <span className="text-ink-700">
                    <span className="font-medium">{c.criterion}</span>
                    {" — "}
                    required {c.required}, actual {c.actual}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
