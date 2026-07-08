import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { AnalyticsSummary } from "../types";

interface Props {
  summary: AnalyticsSummary;
}

export default function ConversionFunnel({ summary }: Props) {
  const data = [
    { stage: "Total Portfolio", count: summary.total_customers_evaluated },
    { stage: "Eligible (Layer 1 rules)", count: summary.eligible_customers },
    { stage: "Surfaced Leads (ML score)", count: summary.surfaced_leads },
  ];

  return (
    <div>
      <p className="text-sm font-semibold text-ink-900 mb-2">Lead Generation Funnel</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="stage" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Bar dataKey="count" fill="#00836C" radius={[4, 4, 0, 0]} barSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
