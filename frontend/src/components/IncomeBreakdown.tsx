import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { CustomerDetail } from "../types";

interface Props {
  customer: CustomerDetail;
}

export default function IncomeBreakdown({ customer }: Props) {
  const data = [
    { name: "Declared", value: customer.declared_income },
    { name: "AI-Estimated", value: customer.estimated_income },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-ink-900">Income Verification</p>
        <span className="text-xs text-ink-500">
          Confidence: {customer.income_confidence_pct.toFixed(0)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={11} />
          <YAxis type="category" dataKey="name" width={80} fontSize={12} />
          <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
          <Bar dataKey="value" fill="#d94530" radius={[0, 4, 4, 0]} barSize={26} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-ink-500 mt-1">
        {customer.declared_vs_estimated_gap_pct > 0
          ? `Declared income is ${customer.declared_vs_estimated_gap_pct.toFixed(1)}% above transaction-verified estimate — flag for underwriting review.`
          : `Declared income is ${Math.abs(customer.declared_vs_estimated_gap_pct).toFixed(1)}% below transaction-verified estimate — customer may qualify for a higher ticket size.`}
      </p>
    </div>
  );
}
