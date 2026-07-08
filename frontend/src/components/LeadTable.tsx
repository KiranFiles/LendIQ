import type { LeadSummary, LoanType } from "../types";
import Tooltip from "./Tooltip";

/* ── constants ─────────────────────────────────── */
const PRODUCT_LABEL: Record<LoanType, string> = {
  personal_loan: "Personal Loan",
  auto_loan: "Auto Loan",
  home_loan: "Home Loan",
  mortgage_loan: "Mortgage Loan",
};

const PRODUCT_COLOR: Record<LoanType, string> = {
  personal_loan: "bg-purple-100 text-purple-700",
  auto_loan: "bg-blue-100 text-blue-700",
  home_loan: "bg-teal-100 text-teal-700",
  mortgage_loan: "bg-orange-100 text-orange-700",
};

/* ── tooltip definitions for every column ─────── */
const COL_TIPS = {
  customer: "Unique customer ID from the bank's CRM. Click any row to open the full profile.",
  occupation: "Customer's employment type: Salaried, Self-employed, or Business owner. Self-employed customers often have the largest gap between declared and actual income.",
  declared: "Income the customer self-reported on their loan application form. May be inflated, especially for self-employed/business owners.",
  estimated:
    "AI-estimated true income from a Random Forest model trained on transaction patterns (UPI inflows, credit regularity, debit patterns). More accurate than declared income for self-employed customers.\n\nConfidence % = certainty of the prediction (higher = better).",
  gap: "Difference between declared and AI-estimated income.\n\n🔴 Positive (declared > estimated): Customer may be overstating income — flag for underwriting review.\n🟢 Negative (declared < estimated): Customer may qualify for a higher loan amount than they applied for.",
  product:
    "The highest-value loan product this customer is eligible for, based on income, DTI, bureau score, bounce count, and age band. Checked against all 4 products.",
  intent:
    "Probability (0–100) that this customer will genuinely convert when contacted.\n\nDriven by: loan page visits, EMI calculator usage, days since last inquiry, and existing-customer status.\n\nModel: Logistic Regression · AUC ≈ 0.80+",
  capacity:
    "How much income headroom remains after existing EMIs and the proposed loan EMI.\n\nFormula: 1 − (existing EMI + 10% income proxy) ÷ AI-estimated income\n\nHigher = customer has more breathing room to repay comfortably.",
  priority:
    "Final blended score used to decide if this lead is surfaced to a Relationship Manager.\n\nFormula: 50% Repayment Capacity + 50% Intent Score\n\n🔥 ≥75 = Hot lead — call today\n✅ 55–74 = Surfaced lead — worth contacting\n⬜ <55 = Below threshold — monitor only\n\nThreshold = 55 (tuned for >30% backtested conversion rate)",
  surfaced:
    "A Surfaced Lead has passed TWO filters:\n\n1️⃣ Layer 1 — Rule engine: eligible for at least one loan product (income, DTI, bureau score, bounces, age all pass).\n\n2️⃣ Layer 2 — ML scoring: Priority Score ≥ 55/100, meaning the customer both CAN repay AND is actively researching a loan.\n\nOnly ~18% of all evaluated customers become Surfaced Leads, but ~35% of those will actually convert — vs ~8% with traditional broad-list calling.",
};

/* ── sub-components ────────────────────────────── */
interface LeadTableProps {
  leads: LeadSummary[];
  onSelect: (customerId: string) => void;
  selectedId?: string;
}

/** Info icon used next to column headers */
function InfoIcon() {
  return (
    <svg
      className="inline-block ml-1 w-3 h-3 text-gray-400 flex-shrink-0"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v5M8 5v.5" strokeLinecap="round" />
    </svg>
  );
}

/** Animated mini score bar shown in each row */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold w-6 text-right tabular-nums" style={{ color }}>
        {pct}
      </span>
    </div>
  );
}

/** Priority badge with surfaced-lead tooltip */
function PriorityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);

  let badgeClass = "bg-gray-100 text-gray-500";
  let label = `${pct}`;
  if (pct >= 75) {
    badgeClass = "bg-brand-100 text-brand-600";
    label = `🔥 ${pct}`;
  } else if (pct >= 55) {
    badgeClass = "bg-idbi-100 text-idbi-600";
    label = `✅ ${pct}`;
  }

  return (
    <Tooltip content={<PriorityTip score={pct} />} position="left" maxWidth={280}>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-default ${badgeClass}`}
      >
        {label}
      </span>
    </Tooltip>
  );
}

function PriorityTip({ score }: { score: number }) {
  const surfaced = score >= 55;
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-white">
        Priority Score: {score}/100
      </p>
      <p className="text-gray-300 text-[11px]">= 50% Repayment Capacity + 50% Intent</p>
      <div className="border-t border-gray-600 pt-1.5">
        {surfaced ? (
          <>
            <p className="text-emerald-400 font-medium">✅ Surfaced Lead</p>
            <p className="text-gray-300 text-[11px] mt-0.5">
              This customer passed both the eligibility rules AND the ML intent filter.
              Recommend to RM for outreach.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-400 font-medium">Below threshold (55)</p>
            <p className="text-gray-300 text-[11px] mt-0.5">
              Not yet surfaced. Monitor for increased engagement before contacting.
            </p>
          </>
        )}
      </div>
      <div className="border-t border-gray-600 pt-1.5 text-[10px] text-gray-400">
        🔥 ≥75 Hot · ✅ 55–74 Surfaced · ⬜ &lt;55 Below threshold
      </div>
    </div>
  );
}

/** Helper: column header with tooltip */
function TH({
  tip,
  align = "left",
  children,
}: {
  tip: string;
  align?: "left" | "right" | "center";
  children: React.ReactNode;
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th className={`${alignClass} px-4 py-3 font-medium`}>
      <Tooltip content={<p className="text-[11px] leading-relaxed whitespace-pre-line">{tip}</p>} position="bottom" maxWidth={260}>
        <span className="cursor-default inline-flex items-center gap-0.5 hover:text-gray-700 transition-colors">
          {children}
          <InfoIcon />
        </span>
      </Tooltip>
    </th>
  );
}

/* ── main component ────────────────────────────── */
export default function LeadTable({ leads, onSelect, selectedId }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500 text-sm">
        No leads match the current filters.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <TH tip={COL_TIPS.customer}>Customer</TH>
              <TH tip={COL_TIPS.occupation}>Occupation</TH>
              <TH tip={COL_TIPS.declared} align="right">Declared ₹</TH>
              <TH tip={COL_TIPS.estimated} align="right">AI-Est. ₹</TH>
              <TH tip={COL_TIPS.gap} align="right">Income Gap</TH>
              <TH tip={COL_TIPS.product}>Product</TH>
              <th className="px-4 py-3 font-medium min-w-[110px]">
                <Tooltip
                  content={<p className="text-[11px] leading-relaxed whitespace-pre-line">{COL_TIPS.intent}</p>}
                  position="bottom"
                  maxWidth={260}
                >
                  <span className="cursor-default inline-flex items-center gap-0.5 hover:text-gray-700 transition-colors">
                    <span className="flex flex-col gap-0.5 text-left">
                      <span>Intent</span>
                      <span className="text-[9px] normal-case text-gray-400 font-normal">Digital engagement</span>
                    </span>
                    <InfoIcon />
                  </span>
                </Tooltip>
              </th>
              <th className="px-4 py-3 font-medium min-w-[110px]">
                <Tooltip
                  content={<p className="text-[11px] leading-relaxed whitespace-pre-line">{COL_TIPS.capacity}</p>}
                  position="bottom"
                  maxWidth={260}
                >
                  <span className="cursor-default inline-flex items-center gap-0.5 hover:text-gray-700 transition-colors">
                    <span className="flex flex-col gap-0.5 text-left">
                      <span>Capacity</span>
                      <span className="text-[9px] normal-case text-gray-400 font-normal">Income headroom</span>
                    </span>
                    <InfoIcon />
                  </span>
                </Tooltip>
              </th>
              <th className="text-center px-4 py-3 font-medium">
                <Tooltip
                  content={<p className="text-[11px] leading-relaxed whitespace-pre-line">{COL_TIPS.priority}</p>}
                  position="bottom"
                  maxWidth={280}
                >
                  <span className="cursor-default inline-flex items-center gap-0.5 hover:text-gray-700 transition-colors">
                    <span className="flex flex-col gap-0.5">
                      <span>Priority</span>
                      <span className="text-[9px] normal-case text-gray-400 font-normal">50% cap + 50% intent</span>
                    </span>
                    <InfoIcon />
                  </span>
                </Tooltip>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => {
              const gapAbs = Math.abs(lead.declared_vs_estimated_gap_pct);
              const gapPositive = lead.declared_vs_estimated_gap_pct > 0;

              return (
                <tr
                  key={lead.customer_id}
                  onClick={() => onSelect(lead.customer_id)}
                  className={`cursor-pointer hover:bg-brand-50 transition-colors ${
                    selectedId === lead.customer_id ? "bg-brand-50 border-l-2 border-brand-500" : ""
                  }`}
                >
                  {/* Customer */}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {lead.customer_id}
                    <p className="text-[10px] text-gray-400 font-normal">Age {lead.age}</p>
                  </td>

                  {/* Occupation */}
                  <td className="px-4 py-3 capitalize text-gray-600 text-xs">
                    {lead.occupation_type.replace(/_/g, " ")}
                  </td>

                  {/* Declared income */}
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    ₹{lead.declared_income.toLocaleString("en-IN")}
                  </td>

                  {/* AI-estimated income */}
                  <td className="px-4 py-3 text-right text-xs">
                    <span className="font-semibold text-gray-900">
                      ₹{lead.estimated_income.toLocaleString("en-IN")}
                    </span>
                    <Tooltip
                      content={
                        <p className="text-[11px]">
                          Model confidence: <strong>{lead.income_confidence_pct.toFixed(0)}%</strong>
                          <br />Higher = model trees agreed closely on this estimate.
                        </p>
                      }
                      position="left"
                    >
                      <p className="text-[10px] text-gray-400 cursor-default inline-flex items-center gap-0.5">
                        {lead.income_confidence_pct.toFixed(0)}% conf.
                        <InfoIcon />
                      </p>
                    </Tooltip>
                  </td>

                  {/* Gap */}
                  <td className="px-4 py-3 text-right text-xs">
                    <Tooltip
                      content={
                        <p className="text-[11px] leading-relaxed">
                          {gapPositive
                            ? "🔴 Customer declared more than AI estimates. Could indicate income inflation — underwriter should verify."
                            : "🟢 Customer's actual transactions suggest higher income than declared. May qualify for a larger loan."}
                        </p>
                      }
                      position="left"
                    >
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded cursor-default ${
                          gapAbs > 20
                            ? gapPositive
                              ? "bg-red-50 text-red-600 font-medium"
                              : "bg-emerald-50 text-emerald-600 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {gapPositive ? "+" : ""}
                        {lead.declared_vs_estimated_gap_pct.toFixed(1)}%
                      </span>
                    </Tooltip>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3">
                    {lead.recommended_product ? (
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-[11px] font-medium ${
                          PRODUCT_COLOR[lead.recommended_product]
                        }`}
                      >
                        {PRODUCT_LABEL[lead.recommended_product]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Not eligible</span>
                    )}
                  </td>

                  {/* Intent bar */}
                  <td className="px-4 py-3">
                    <MiniBar pct={Math.round(lead.intent_score * 100)} color="#F58220" />
                  </td>

                  {/* Capacity bar */}
                  <td className="px-4 py-3">
                    <MiniBar pct={Math.round(lead.repayment_capacity_score * 100)} color="#00836C" />
                  </td>

                  {/* Priority badge */}
                  <td className="px-4 py-3 text-center">
                    <PriorityBadge score={lead.priority_score} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
