interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "default" | "positive" | "warning";
}

export default function StatCard({ label, value, sublabel, accent = "default" }: StatCardProps) {
  const accentClass =
    accent === "positive"
      ? "text-idbi-500"
      : accent === "warning"
      ? "text-amber-500"
      : "text-ink-900";

  const topBarClass =
    accent === "positive"
      ? "bg-idbi-500"
      : accent === "warning"
      ? "bg-amber-400"
      : "bg-brand-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* IDBI brand accent top bar */}
      <div className={`h-1 ${topBarClass}`} />
      <div className="p-4">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${accentClass}`}>{value}</p>
        {sublabel && <p className="text-xs text-ink-500 mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}
