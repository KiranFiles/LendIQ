import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-500 text-white" : "text-ink-700 hover:bg-brand-50"
  }`;

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white min-h-screen p-4">
      <div className="mb-6 px-1">
        <p className="text-sm font-bold text-ink-900 leading-tight">LendIQ</p>
        <p className="text-xs text-ink-500">Lead Intelligence Engine</p>
      </div>
      <nav className="space-y-1">
        <NavLink to="/" end className={linkClass}>
          Lead Pipeline
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          Model Analytics
        </NavLink>
      </nav>
      <div className="mt-8 px-4 py-3 rounded-lg bg-brand-50 text-xs text-ink-700 leading-relaxed">
        Track 02 · Lead Generation / Behavioural Analytics / Retail Lending
      </div>
    </aside>
  );
}
