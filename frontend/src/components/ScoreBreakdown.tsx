import { useEffect, useRef } from "react";
import type { CustomerDetail } from "../types";

/* ───────────────────────────────────────────────
   Animated SVG arc gauge
─────────────────────────────────────────────── */
interface GaugeProps {
  value: number;       // 0-1
  color: string;       // tailwind stroke colour (hex)
  size?: number;
}

function ArcGauge({ value, color, size = 80 }: GaugeProps) {
  const ref = useRef<SVGCircleElement>(null);
  const r = 34;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half arc
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - Math.min(value, 1));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // start from 0, animate to target
    el.style.strokeDashoffset = `${circumference}`;
    const raf = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)";
      el.style.strokeDashoffset = `${strokeDashoffset}`;
    });
    return () => cancelAnimationFrame(raf);
  }, [value, circumference, strokeDashoffset]);

  return (
    <svg
      width={size}
      height={size / 2 + 6}
      viewBox={`0 0 ${size} ${size / 2 + 6}`}
      className="overflow-visible"
    >
      {/* track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* fill */}
      <circle
        ref={ref}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference * 2}`}
        strokeDashoffset={circumference}
        transform={`rotate(-180 ${cx} ${cy})`}
      />
    </svg>
  );
}

/* ───────────────────────────────────────────────
   Score card with gauge + label + explanation
─────────────────────────────────────────────── */
interface ScoreCardProps {
  label: string;
  value: number;       // 0-1
  color: string;
  badge: string;
  badgeBg: string;
  explanation: string;
  detail: string;
}

function ScoreCard({ label, value, color, badge, badgeBg, explanation, detail }: ScoreCardProps) {
  const pct = Math.round(value * 100);
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col items-center gap-1 relative group">
      {/* gauge */}
      <div className="relative">
        <ArcGauge value={value} color={color} size={90} />
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-lg font-bold"
          style={{ color }}
        >
          {pct}
        </span>
      </div>
      {/* label */}
      <p className="text-xs font-semibold text-gray-600 text-center leading-tight mt-1">{label}</p>
      {/* badge */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>
        {badge}
      </span>
      {/* tooltip on hover */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-gray-900 text-white text-[11px] rounded-lg p-2.5 leading-snug opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
        <p className="font-semibold mb-1">{explanation}</p>
        <p className="text-gray-300">{detail}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
function intentBadge(score: number): { badge: string; badgeBg: string } {
  if (score >= 0.7) return { badge: "High intent", badgeBg: "bg-emerald-100 text-emerald-700" };
  if (score >= 0.45) return { badge: "Moderate intent", badgeBg: "bg-amber-100 text-amber-700" };
  return { badge: "Low intent", badgeBg: "bg-gray-100 text-gray-500" };
}

function capacityBadge(score: number): { badge: string; badgeBg: string } {
  if (score >= 0.65) return { badge: "Strong capacity", badgeBg: "bg-emerald-100 text-emerald-700" };
  if (score >= 0.4) return { badge: "Moderate capacity", badgeBg: "bg-amber-100 text-amber-700" };
  return { badge: "Stretched", badgeBg: "bg-red-100 text-red-600" };
}
function priorityBadge(score: number): { badge: string; badgeBg: string } {
  if (score >= 0.75) return { badge: "🔥 Hot lead", badgeBg: "bg-emerald-100 text-emerald-700" };
  if (score >= 0.55) return { badge: "✅ Surfaced lead", badgeBg: "bg-blue-100 text-blue-700" };
  return { badge: "Below threshold", badgeBg: "bg-gray-100 text-gray-500" };
}


/* ───────────────────────────────────────────────
   Main export
─────────────────────────────────────────────── */
interface Props {
  customer: CustomerDetail;
}

export default function ScoreBreakdown({ customer }: Props) {
  const { badge: intentB, badgeBg: intentBg } = intentBadge(customer.intent_score);
  const { badge: capB, badgeBg: capBg } = capacityBadge(customer.repayment_capacity_score);
  const { badge: priB, badgeBg: priBg } = priorityBadge(customer.priority_score);

  // Income confidence card is special
  const confBadgeBg =
    customer.income_confidence_pct >= 80
      ? "bg-emerald-100 text-emerald-700"
      : customer.income_confidence_pct >= 60
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-600";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm font-semibold text-gray-800">Score Breakdown</p>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Hover each card for details
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">

        {/* 1. Estimated income confidence */}
        <ScoreCard
          label="Income Confidence (AI Model)"
          value={customer.income_confidence_pct / 100}
          color="#6366f1"
          badge={`${customer.income_confidence_pct.toFixed(0)}% confident`}
          badgeBg={confBadgeBg}
          explanation="How certain the Random Forest model is about the income estimate."
          detail={`Computed from the standard deviation across 300 decision trees. Low std-dev → high confidence. Declared ₹${customer.declared_income.toLocaleString("en-IN")} vs AI-estimated ₹${customer.estimated_income.toLocaleString("en-IN")}.`}
        />

        {/* 2. Repayment capacity */}
        <ScoreCard
          label="Repayment Capacity"
          value={customer.repayment_capacity_score}
          color="#10b981"
          badge={capB}
          badgeBg={capBg}
          explanation="How much income headroom remains after existing + proposed EMI."
          detail={`Formula: 1 − (existing EMI ₹${customer.existing_emi_outflow.toLocaleString("en-IN")} + 10% income proxy) ÷ estimated income. Higher = more room to repay comfortably.`}
        />

        {/* 3. Intent score */}
        <ScoreCard
          label="Intent Score (ML)"
          value={customer.intent_score}
          color="#f59e0b"
          badge={intentB}
          badgeBg={intentBg}
          explanation="Logistic Regression probability that this customer will genuinely convert when approached."
          detail={`Driven by: loan page visits (${customer.behavioural_signals.loan_page_visits_30d} in 30d), EMI calculator uses (${customer.behavioural_signals.emi_calculator_uses_30d}), days since last inquiry (${customer.behavioural_signals.days_since_last_inquiry}), existing customer: ${customer.behavioural_signals.existing_customer ? "Yes" : "No"}.`}
        />

        {/* 4. Priority score */}
        <ScoreCard
          label="Priority Score (Final)"
          value={customer.priority_score}
          color={customer.priority_score >= 0.55 ? "#d94530" : "#9ca3af"}
          badge={priB}
          badgeBg={priBg}
          explanation="Blended score used to decide if this lead is surfaced to a Relationship Manager."
          detail={`= 50% Repayment Capacity (${(customer.repayment_capacity_score * 100).toFixed(0)}) + 50% Intent (${(customer.intent_score * 100).toFixed(0)}). Surface threshold: 55. ${customer.is_surfaced_lead ? "✅ This lead IS surfaced." : "❌ Below threshold — not surfaced."}`}
        />
      </div>

      {/* Priority score formula bar */}
      <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
        <p className="text-[11px] text-gray-500 font-medium mb-2 uppercase tracking-wide">
          Priority Score = 50% Capacity + 50% Intent
        </p>
        <div className="flex gap-2 items-center">
          {/* capacity half */}
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Repayment Capacity</span>
              <span>{(customer.repayment_capacity_score * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${customer.repayment_capacity_score * 100}%`,
                  backgroundColor: "#10b981",
                }}
              />
            </div>
          </div>
          <span className="text-gray-400 text-xs font-bold">+</span>
          {/* intent half */}
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Intent Score</span>
              <span>{(customer.intent_score * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${customer.intent_score * 100}%`,
                  backgroundColor: "#f59e0b",
                }}
              />
            </div>
          </div>
          <span className="text-gray-400 text-xs font-bold">=</span>
          {/* priority result */}
          <div className="w-16 text-center">
            <p
              className="text-xl font-bold"
              style={{ color: customer.priority_score >= 0.55 ? "#d94530" : "#9ca3af" }}
            >
              {(customer.priority_score * 100).toFixed(0)}
            </p>
            <p className="text-[9px] text-gray-400">/ 100</p>
          </div>
        </div>
        {/* ── Surface gate bar ── */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
              Priority Score vs Surfacing Gate
            </span>
            {customer.is_surfaced_lead ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✅ Surfaced — RM should call
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                ⬜ Below gate — monitor only
              </span>
            )}
          </div>

          {/* Bar */}
          <div className="relative h-2.5 bg-gray-100 rounded-full">
            <div
              className="absolute h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(customer.priority_score * 100, 100)}%`,
                backgroundColor: customer.priority_score >= 0.55 ? "#d94530" : "#9ca3af",
              }}
            />
            {/* Gate line */}
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-500 z-10"
              style={{ left: "55%" }}
            />
          </div>

          {/* Below-bar annotation */}
          <div className="relative h-4 mt-0.5">
            <span
              className="absolute text-[9px] text-gray-500 font-medium"
              style={{ left: "calc(55% - 14px)" }}
            >
              Gate = 55
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            <span className="font-semibold text-gray-600">Gate = 55</span> is the minimum score
            needed to be surfaced to an RM. A customer must score ≥ 55 out of 100 on both
            repayment ability and intent before the bank considers them a priority lead.
          </p>
        </div>
      </div>
    </div>
  );
}
