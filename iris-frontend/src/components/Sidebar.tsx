interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAboutOpen: () => void;
  onExit: () => void;
}

/* ── Icons ─────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  {
    label: "Overview",
    page: "overview",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Risk Map",
    page: "map",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    page: "analytics",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    label: "Stakeholders",
    page: "stakeholders",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    page: "settings",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ currentPage, onNavigate, onAboutOpen, onExit }: SidebarProps) {
  return (
    <>
    {/* ── Desktop Sidebar ─────────────────────────────── */}
    <aside className="hidden md:flex w-56 bg-navy-900/80 border-r border-navy-700/50 flex-col flex-shrink-0 backdrop-blur-md">
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-navy-700/30">
        <button
          onClick={onExit}
          className="flex items-center gap-3 group cursor-pointer"
          title="Back to Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 group-hover:shadow-cyan-500/40 transition-shadow">
            <span className="text-white font-black text-xs leading-none">IR</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-gradient-iris leading-none tracking-wide group-hover:opacity-80 transition-opacity">IRIS</h1>
            <p className="text-[8px] text-slate-600 font-semibold tracking-[0.15em] uppercase mt-0.5">Risk Intelligence</p>
          </div>
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] px-3 mb-2">Navigation</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <li key={item.page}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`
                    relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left
                    transition-all duration-200
                    ${isActive
                      ? "bg-cyan-500/10 text-cyan-400 shadow-sm"
                      : "text-slate-500 hover:bg-navy-700/40 hover:text-slate-300"
                    }
                  `}
                >
                  {/* Active bar */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-cyan-400" />
                  )}
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="text-[13px] font-semibold">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom Status ─────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-navy-700/30 space-y-2">
        <button
          onClick={onAboutOpen}
          className="flex items-center gap-2.5 w-full text-left text-slate-600 hover:text-cyan-400 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span className="text-[11px] font-semibold">About IRIS</span>
        </button>
        <button
          onClick={onExit}
          className="flex items-center gap-2.5 w-full text-left text-slate-600 hover:text-rose-400 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span className="text-[11px] font-semibold">Back to Home</span>
        </button>
        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <div>
            <p className="text-[10px] font-bold text-slate-400">System Active</p>
            <p className="text-[8px] text-slate-600 font-mono">v1.0 &bull; 4 Agents Online</p>
          </div>
        </div>
      </div>
    </aside>

    {/* ── Mobile Bottom Tab Bar ───────────────────────── */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-md border-t border-navy-700/50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 transition-colors ${
                isActive ? "text-cyan-400" : "text-slate-600"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-[8px] font-bold mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
