import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
    ? "bg-brand-500 text-white shadow-sm"
    : "text-ink-700 hover:bg-brand-50 hover:text-brand-600"
  }`;

// IDBI Bank lotus-inspired SVG icon (abstract)
function IdbiLogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Orange lotus petal shape */}
      <path d="M16 4 C16 4 8 10 8 18 C8 22 11 25 16 26 C21 25 24 22 24 18 C24 10 16 4 16 4Z" fill="#F58220" opacity="0.9" />
      <path d="M16 8 C16 8 10 13 10 19 C10 22 12.5 24 16 25 C19.5 24 22 22 22 19 C22 13 16 8 16 8Z" fill="white" opacity="0.3" />
      {/* Center dot = stylized 'i' */}
      <circle cx="16" cy="18" r="2.5" fill="white" />
      <circle cx="16" cy="12" r="1.5" fill="white" />
    </svg>
  );
}

// Pipeline/dashboard icon
function PipelineIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <rect x="1" y="10" width="4" height="5" rx="0.5" fill={active ? "white" : "none"} strokeOpacity={active ? 0 : 1} />
      <rect x="6" y="6" width="4" height="9" rx="0.5" fill={active ? "white" : "none"} strokeOpacity={active ? 0 : 1} />
      <rect x="11" y="2" width="4" height="13" rx="0.5" fill={active ? "white" : "none"} strokeOpacity={active ? 0 : 1} />
    </svg>
  );
}

// Analytics icon
function AnalyticsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <polyline points="1,12 5,7 9,9 15,3" />
      {active && <circle cx="15" cy="3" r="1.5" fill="white" stroke="none" />}
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto bg-white border-r border-gray-200 shadow-sm">
      {/* IDBI Bank branded header */}
      <div className="bg-brand-500 px-5 py-5">
        <div className="flex items-center gap-3 mb-3">
          <IdbiLogoMark />
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-wide">IDBI Bank</p>
            <p className="text-orange-100 text-[10px] font-medium leading-tight uppercase tracking-widest">Innovate 2026</p>
          </div>
        </div>
        <div className="border-t border-white/20 pt-3">
          <p className="text-white font-semibold text-lg leading-tight">LendIQ</p>
          <p className="text-orange-100 text-xs mt-0.5">Lead Intelligence Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2 px-1">Navigation</p>
        <NavLink to="/" end className={linkClass}>
          {({ isActive }) => (
            <>
              <PipelineIcon active={isActive} />
              Lead Pipeline
            </>
          )}
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          {({ isActive }) => (
            <>
              <AnalyticsIcon active={isActive} />
              Model Analytics
            </>
          )}
        </NavLink>
      </nav>

      {/* Track badge at bottom */}
      <div className="p-4">
        <div className="rounded-xl bg-idbi-50 border border-idbi-100 px-4 py-3">
          <p className="text-[10px] font-bold text-idbi-600 uppercase tracking-wider mb-1">Hackathon Track</p>
          <p className="text-xs text-idbi-700 leading-relaxed font-medium">
            Track 02 · Lead Generation<br />
            Behavioural Analytics<br />
            Retail Lending
          </p>
        </div>
        {/* <p className="text-center text-[9px] text-gray-300 mt-3 font-medium">
          Powered by IDBI Bank Data
        </p> */}
      </div>
    </aside>
  );
}
