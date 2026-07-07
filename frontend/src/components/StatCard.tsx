interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "default" | "positive" | "warning";
}

export default function StatCard({ label, value, sublabel, accent = "default" }: StatCardProps) {
  const accentClass =
    accent === "positive"
      ? "text-emerald-600"
      : accent === "warning"
      ? "text-amber-600"
      : "text-ink-900";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
      {sublabel && <p className="text-xs text-ink-500 mt-1">{sublabel}</p>}
    </div>
  );
}
